import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { StorageService } from '../../config/storage.service';
import { BatchesService } from '../batches/batches.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationsService } from '../notifications/notifications.service';

// Multer/busboy decode multipart filenames as latin1, which garbles accented names
// ("CriaÃ§Ã£o.png"). Re-decode as UTF-8 whenever that yields a valid string.
export const decodeFilename = (name: string): string => {
  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  return decoded.includes('�') ? name : decoded;
};

@Injectable()
export class CreativesService {
  constructor(
    private prisma: PrismaService,
    private batchesService: BatchesService,
    private activityLogService: ActivityLogService,
    private notificationsService: NotificationsService,
    private storageService: StorageService,
  ) {}

  async create(batchId: string, files: Express.Multer.File[], userId: string) {
    // Verify batch ownership; if it fails the temp uploads must not linger on disk
    const batch = await this.batchesService.findOne(batchId, userId).catch(async (error) => {
      await this.storageService.discard(files);
      throw error;
    });

    const creatives = await Promise.all(
      files.map(async (file, index) => {
        const fileType = this.getFileType(file.mimetype);
        const fileUrl = await this.storageService.save(file);

        // Creative, v1 version, approval and adjustment status are written in a single
        // nested create — a creative without its approval row could never be decided.
        return this.prisma.creative.create({
          data: {
            batchId,
            name: decodeFilename(file.originalname),
            fileUrl,
            fileType,
            order: batch.creatives.length + index,
            currentVersion: 1,
            revisionCount: 0,
            versions: {
              create: { version: 1, fileUrl, fileType, uploadedByUserId: userId },
            },
            approval: {
              create: { status: 'PENDING', reviewedVersion: 1 },
            },
            adjustmentStatus: {
              create: { status: 'NOT_STARTED' },
            },
          },
        });
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
    const creative = await this.findOne(id, userId).catch(async (error) => {
      await this.storageService.discard([file]);
      throw error;
    });

    if (creative.approval?.status !== 'REJECTED') {
      await this.storageService.discard([file]);
      throw new BadRequestException('Só é possível enviar revisão para criativos reprovados');
    }

    const fileType = this.getFileType(file.mimetype);
    const fileUrl = await this.storageService.save(file);
    const newVersion = creative.currentVersion + 1;

    try {
      // Version bump, file swap, approval reset and adjustment status move together —
      // a partial failure would leave the unique (creativeId, version) permanently taken.
      await this.prisma.$transaction(async (tx) => {
        // Guard: only one concurrent revision may move the approval back to PENDING
        const reset = await tx.approval.updateMany({
          where: { creativeId: id, status: 'REJECTED' },
          data: {
            status: 'PENDING',
            reviewedVersion: newVersion,
            feedbackText: null,
            feedbackProvidedAt: null,
          },
        });
        if (reset.count === 0) {
          throw new BadRequestException('Só é possível enviar revisão para criativos reprovados');
        }

        await tx.creativeVersion.create({
          data: { creativeId: id, version: newVersion, fileUrl, fileType, uploadedByUserId: userId },
        });

        await tx.creative.update({
          where: { id },
          data: { fileUrl, fileType, currentVersion: newVersion, revisionCount: { increment: 1 } },
        });

        await tx.internalAdjustmentStatus.update({
          where: { creativeId: id },
          data: { status: 'RESENT', updatedByUserId: userId },
        });
      });
    } catch (error) {
      // The transaction rolled back: don't leave an orphan file behind
      await this.storageService.remove(fileUrl);
      throw error;
    }

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
      throw new ForbiddenException('Acesso negado');
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
      throw new NotFoundException('Criativo não encontrado');
    }

    // Verify ownership through batch
    const isOwner = await this.batchesService.verifyOwnership(creative.batchId, userId);
    if (!isOwner) {
      throw new ForbiddenException('Acesso negado');
    }

    return creative;
  }

  async updateName(id: string, name: string, userId: string) {
    const creative = await this.findOne(id, userId);
    if (creative.name === name) {
      return creative;
    }

    const updated = await this.prisma.creative.update({
      where: { id },
      data: { name },
    });

    await this.activityLogService.log({
      batchId: creative.batchId,
      creativeId: id,
      userId,
      action: 'CREATIVE_RENAMED',
      details: { from: creative.name, to: name },
    });

    return updated;
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
        status,
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

    // Files go after the row: a failed DB delete must never orphan the database
    await Promise.all(creative.versions.map((v) => this.storageService.remove(v.fileUrl)));

    await this.batchesService.updateCounts(creative.batchId);

    // No creativeId here: the creative's own log entries were cascade-deleted with it
    await this.activityLogService.log({
      batchId: creative.batchId,
      userId,
      action: 'CREATIVE_DELETED',
      details: { creativeName: creative.name },
    });

    return { deleted: true };
  }

  private getFileType(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'IMAGE';
    if (mimetype.startsWith('video/')) return 'VIDEO';
    return 'TEXT';
  }
}
