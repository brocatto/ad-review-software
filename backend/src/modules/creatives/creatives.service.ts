import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { BatchesService } from '../batches/batches.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CreativesService {
  constructor(
    private prisma: PrismaService,
    private batchesService: BatchesService,
    private activityLogService: ActivityLogService,
    private notificationsService: NotificationsService,
  ) {}

  async create(batchId: string, files: Express.Multer.File[], userId: string) {
    const batch = await this.batchesService.findOne(batchId);

    const creatives = await Promise.all(
      files.map(async (file, index) => {
        const fileType = this.getFileType(file.mimetype);
        const fileUrl = `/uploads/${file.filename}`;

        const creative = await this.prisma.creative.create({
          data: {
            batchId,
            name: file.originalname,
            fileUrl,
            fileType,
            order: batch.creatives.length + index,
            currentVersion: 1,
            revisionCount: 0,
          },
        });

        // Create initial version
        await this.prisma.creativeVersion.create({
          data: {
            creativeId: creative.id,
            version: 1,
            fileUrl,
            fileType,
            uploadedByUserId: userId,
          },
        });

        await this.prisma.approval.create({
          data: {
            creativeId: creative.id,
            status: 'PENDING',
            reviewedVersion: 1,
          },
        });

        await this.prisma.internalAdjustmentStatus.create({
          data: {
            creativeId: creative.id,
            status: 'NOT_STARTED',
          },
        });

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
    const creative = await this.findOne(id);

    // Check if creative was rejected
    if (creative.approval?.status !== 'REJECTED') {
      throw new Error('Só é possível enviar revisão para criativos reprovados');
    }

    const fileType = this.getFileType(file.mimetype);
    const fileUrl = `/uploads/${file.filename}`;
    const newVersion = creative.currentVersion + 1;

    // Create new version
    await this.prisma.creativeVersion.create({
      data: {
        creativeId: id,
        version: newVersion,
        fileUrl,
        fileType,
        uploadedByUserId: userId,
      },
    });

    // Update creative with new file
    await this.prisma.creative.update({
      where: { id },
      data: {
        fileUrl,
        fileType,
        currentVersion: newVersion,
        revisionCount: { increment: 1 },
      },
    });

    // Reset approval to pending
    await this.prisma.approval.update({
      where: { creativeId: id },
      data: {
        status: 'PENDING',
        reviewedVersion: newVersion,
        feedbackText: null,
        feedbackProvidedAt: null,
      },
    });

    // Update adjustment status to resent
    await this.prisma.internalAdjustmentStatus.update({
      where: { creativeId: id },
      data: {
        status: 'RESENT',
        updatedByUserId: userId,
      },
    });

    // Update batch counts
    await this.batchesService.updateCounts(creative.batchId);

    await this.activityLogService.log({
      batchId: creative.batchId,
      creativeId: id,
      userId,
      action: 'REVISION_UPLOADED',
      details: { version: newVersion },
    });

    return this.findOne(id);
  }

  async findByBatch(batchId: string) {
    return this.prisma.creative.findMany({
      where: { batchId },
      include: {
        approval: true,
        adjustmentStatus: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
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

    return creative;
  }

  async updateName(id: string, name: string) {
    await this.findOne(id);

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
    const creative = await this.findOne(id);

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

  async remove(id: string) {
    const creative = await this.findOne(id);

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
