import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { v4 as uuidv4 } from 'uuid';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../../config/storage.service';

@Injectable()
export class BatchesService {
  constructor(
    private prisma: PrismaService,
    private activityLogService: ActivityLogService,
    private notificationsService: NotificationsService,
    private storageService: StorageService,
  ) {}

  async create(createBatchDto: CreateBatchDto, userId: string) {
    const batch = await this.prisma.batch.create({
      data: {
        name: createBatchDto.name,
        clientId: createBatchDto.clientId,
        createdByUserId: userId,
        accessToken: uuidv4(),
      },
      include: {
        client: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    await this.activityLogService.log({
      batchId: batch.id,
      userId,
      action: 'BATCH_CREATED',
      details: { batchName: batch.name },
    });

    return batch;
  }

  async findAll() {
    return this.prisma.batch.findMany({
      include: {
        client: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: { creatives: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        creatives: {
          include: {
            approval: true,
            adjustmentStatus: true,
          },
          orderBy: { order: 'asc' },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return batch;
  }

  async findByAccessToken(accessToken: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { accessToken },
      include: {
        client: true,
        creatives: {
          include: {
            approval: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Filter to show only pending creatives (including re-submitted ones)
    const pendingCreatives = batch.creatives.filter(
      (c) => c.approval?.status === 'PENDING'
    );

    return {
      ...batch,
      creatives: pendingCreatives,
      // Also include counts for all creatives for progress display
      allCreativesCount: batch.creatives.length,
    };
  }

  async updateCounts(batchId: string) {
    const creatives = await this.prisma.creative.findMany({
      where: { batchId },
      include: { approval: true },
    });

    const total = creatives.length;
    const approved = creatives.filter((c) => c.approval?.status === 'APPROVED').length;
    const rejected = creatives.filter((c) => c.approval?.status === 'REJECTED').length;
    const pending = total - approved - rejected;

    let status: 'PENDING' | 'PARTIAL' | 'COMPLETED' = 'PENDING';
    if (pending === 0 && total > 0) {
      status = 'COMPLETED';
    } else if (approved > 0 || rejected > 0) {
      status = 'PARTIAL';
    }

    // Conditional update: only one concurrent caller can move the batch into
    // COMPLETED, so the "completed" notification is sent exactly once.
    const becameCompleted =
      status === 'COMPLETED' &&
      (
        await this.prisma.batch.updateMany({
          where: { id: batchId, status: { not: 'COMPLETED' } },
          data: { status: 'COMPLETED' },
        })
      ).count === 1;

    const updatedBatch = await this.prisma.batch.update({
      where: { id: batchId },
      data: {
        totalCreatives: total,
        approvedCount: approved,
        rejectedCount: rejected,
        pendingCount: pending,
        status,
        lastInteractionAt: new Date(),
      },
      include: {
        client: true,
      },
    });

    if (becameCompleted) {
      await this.notificationsService.notifyBatchCompleted({
        batchId,
        batchName: updatedBatch.name,
        clientName: updatedBatch.client.name,
        totalCreatives: total,
        approvedCount: approved,
        rejectedCount: rejected,
        pendingCount: pending,
        status,
      });
    }

    return updatedBatch;
  }

  async remove(id: string) {
    await this.findOne(id);

    const versions = await this.prisma.creativeVersion.findMany({
      where: { creative: { batchId: id } },
      select: { fileUrl: true },
    });

    const deleted = await this.prisma.batch.delete({
      where: { id },
    });

    await Promise.all(versions.map((v) => this.storageService.remove(v.fileUrl)));

    return deleted;
  }
}
