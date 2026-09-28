import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { PrismaService } from '../../config/prisma.service';
import { BatchesService } from '../batches/batches.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../../config/storage.service';

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
    let batch;
    try {
      batch = await this.batchesService.findOne(batchId);
    } catch (error) {
      await this.discardTempFiles(files);
      throw error;
    }

    const creatives = await Promise.all(
      files.map(async (file, index) => {
        const fileType = this.getFileType(file.mimetype);
        const fileUrl = await this.storageService.save(file);

        return this.prisma.creative.create({
          data: {
            batchId,
            name: file.originalname,
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
    let creative;
    try {
      creative = await this.findOne(id);
      if (creative.approval?.status !== 'REJECTED') {
        throw new BadRequestException('Só é possível enviar revisão para criativos reprovados');
      }
    } catch (error) {
      await this.discardTempFiles([file]);
      throw error;
    }

    const fileType = this.getFileType(file.mimetype);
    const fileUrl = await this.storageService.save(file);
    const newVersion = creative.currentVersion + 1;

    await this.prisma.$transaction(async (tx) => {
      // Guard against two concurrent revisions of the same creative
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
        data: {
          fileUrl,
          fileType,
          currentVersion: newVersion,
          revisionCount: { increment: 1 },
        },
      });

      await tx.internalAdjustmentStatus.update({
        where: { creativeId: id },
        data: { status: 'RESENT', updatedByUserId: userId },
      });
    });

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

  async updateName(id: string, name: string, userId: string) {
    const creative = await this.findOne(id);

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
    const creative = await this.findOne(id);

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
    const creative = await this.findOne(id);

    await this.prisma.creative.delete({
      where: { id },
    });

    await Promise.all(creative.versions.map((v) => this.storageService.remove(v.fileUrl)));

    await this.batchesService.updateCounts(creative.batchId);

    // No creativeId: the creative's own logs are cascade-deleted with it
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

  private async discardTempFiles(files: Express.Multer.File[]) {
    await Promise.all(files.map((f) => fs.rm(f.path, { force: true }).catch(() => undefined)));
  }
}
