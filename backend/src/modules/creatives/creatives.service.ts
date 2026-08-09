import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../config/prisma.service';
import { BatchesService } from '../batches/batches.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CloudinaryService } from '../../config/cloudinary.service';

// Never trust the client-supplied filename: only well-known media extensions are
// preserved, anything else is derived from the mimetype (blocks .html-served-as-image)
const EXTENSION_BY_MIMETYPE: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};
const SAFE_EXTENSIONS = new Set([...Object.values(EXTENSION_BY_MIMETYPE), '.jpeg']);

@Injectable()
export class CreativesService {
  private readonly logger = new Logger(CreativesService.name);
  private useCloudinary: boolean;

  constructor(
    private prisma: PrismaService,
    private batchesService: BatchesService,
    private activityLogService: ActivityLogService,
    private notificationsService: NotificationsService,
    private cloudinaryService: CloudinaryService,
    private configService: ConfigService,
  ) {
    this.useCloudinary = !!this.configService.get<string>('CLOUDINARY_CLOUD_NAME');

    if (!this.useCloudinary && this.configService.get<string>('NODE_ENV') === 'production') {
      this.logger.warn(
        'Cloudinary não configurado em produção: uploads serão gravados em disco local e não sobrevivem a redeploys/múltiplas instâncias.',
      );
    }
  }

  private async storeFile(file: Express.Multer.File): Promise<string> {
    if (this.useCloudinary) {
      return this.cloudinaryService.uploadFile(file);
    }

    const uploadDir = join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const originalExt = extname(file.originalname).toLowerCase();
    const ext = SAFE_EXTENSIONS.has(originalExt)
      ? originalExt
      : EXTENSION_BY_MIMETYPE[file.mimetype] ?? '.bin';
    const filename = `${uuidv4()}${ext}`;
    await fs.writeFile(join(uploadDir, filename), file.buffer);
    return `/uploads/${filename}`;
  }

  async create(batchId: string, files: Express.Multer.File[], userId: string) {
    // Verify batch ownership
    const batch = await this.batchesService.findOne(batchId, userId);

    const creatives = await Promise.all(
      files.map(async (file, index) => {
        const fileType = this.getFileType(file.mimetype);
        const fileUrl = await this.storeFile(file);

        // Creative + version + approval + adjustment must exist together —
        // a creative without its approval row can never be decided by the client.
        // Id is generated app-side so the batched (non-interactive) transaction works.
        const creativeId = uuidv4();
        const [creative] = await this.prisma.$transaction([
          this.prisma.creative.create({
            data: {
              id: creativeId,
              batchId,
              name: file.originalname,
              fileUrl,
              fileType,
              order: batch.creatives.length + index,
              currentVersion: 1,
              revisionCount: 0,
            },
          }),
          this.prisma.creativeVersion.create({
            data: {
              creativeId,
              version: 1,
              fileUrl,
              fileType,
              uploadedByUserId: userId,
            },
          }),
          this.prisma.approval.create({
            data: {
              creativeId,
              status: 'PENDING',
              reviewedVersion: 1,
            },
          }),
          this.prisma.internalAdjustmentStatus.create({
            data: {
              creativeId,
              status: 'NOT_STARTED',
            },
          }),
        ]);

        return creative;
      }),
    );

    await this.batchesService.updateCounts(batchId);

    await this.activityLogService.log({
      batchId,
      userId,
      action: 'CREATIVES_UPLOADED',
      details: { count: files.length },
    });

    // Notify that batch was sent for approval
    await this.notificationsService.notifyBatchSent({
      batchId,
      batchName: batch.name,
      clientName: batch.client.name,
      creativesCount: files.length,
    });

    return creatives;
  }

  async uploadRevision(id: string, file: Express.Multer.File, userId: string) {
    // Verify ownership through batch
    const creative = await this.findOne(id, userId);

    // Check if creative was rejected
    if (creative.approval?.status !== 'REJECTED') {
      throw new BadRequestException('Só é possível enviar revisão para criativos reprovados');
    }

    const fileType = this.getFileType(file.mimetype);
    const fileUrl = await this.storeFile(file);
    const newVersion = creative.currentVersion + 1;

    // Version bump, file swap, approval reset and adjustment status move together —
    // a partial failure would leave the unique (creativeId, version) permanently taken
    await this.prisma.$transaction([
      this.prisma.creativeVersion.create({
        data: {
          creativeId: id,
          version: newVersion,
          fileUrl,
          fileType,
          uploadedByUserId: userId,
        },
      }),
      this.prisma.creative.update({
        where: { id },
        data: {
          fileUrl,
          fileType,
          currentVersion: newVersion,
          revisionCount: { increment: 1 },
        },
      }),
      this.prisma.approval.update({
        where: { creativeId: id },
        data: {
          status: 'PENDING',
          reviewedVersion: newVersion,
          feedbackText: null,
          feedbackProvidedAt: null,
        },
      }),
      this.prisma.internalAdjustmentStatus.update({
        where: { creativeId: id },
        data: {
          status: 'RESENT',
          updatedByUserId: userId,
        },
      }),
    ]);

    // Update batch counts
    await this.batchesService.updateCounts(creative.batchId);

    await this.activityLogService.log({
      batchId: creative.batchId,
      creativeId: id,
      userId,
      action: 'REVISION_UPLOADED',
      details: { version: newVersion },
    });

    return this.findOne(id, userId);
  }

  async findByBatch(batchId: string, userId: string) {
    // Verify batch ownership
    const isOwner = await this.batchesService.verifyOwnership(batchId, userId);
    if (!isOwner) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.creative.findMany({
      where: { batchId },
      include: {
        approval: true,
        adjustmentStatus: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const creative = await this.prisma.creative.findUnique({
      where: { id },
      include: {
        approval: true,
        adjustmentStatus: true,
        batch: true,
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!creative) {
      throw new NotFoundException('Creative not found');
    }

    // Verify ownership through batch
    const isOwner = await this.batchesService.verifyOwnership(creative.batchId, userId);
    if (!isOwner) {
      throw new ForbiddenException('Access denied');
    }

    return creative;
  }

  async updateName(id: string, name: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.creative.update({
      where: { id },
      data: { name },
    });
  }

  async updateAdjustmentStatus(
    id: string,
    status: string,
    notes: string | undefined,
    userId: string,
  ) {
    // Verify ownership through batch
    const creative = await this.findOne(id, userId);

    const updated = await this.prisma.internalAdjustmentStatus.update({
      where: { creativeId: id },
      data: {
        status: status as any,
        notes,
        updatedByUserId: userId,
      },
    });

    await this.activityLogService.log({
      batchId: creative.batchId,
      creativeId: id,
      userId,
      action: 'ADJUSTMENT_STATUS_UPDATED',
      details: { status, notes },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    // Verify ownership through batch
    const creative = await this.findOne(id, userId);

    await this.prisma.creative.delete({
      where: { id },
    });

    await this.batchesService.updateCounts(creative.batchId);

    return { deleted: true };
  }

  private getFileType(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'IMAGE';
    if (mimetype.startsWith('video/')) return 'VIDEO';
    return 'TEXT';
  }
}
