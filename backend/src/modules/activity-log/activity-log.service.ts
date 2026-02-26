import { Injectable, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { BatchesService } from '../batches/batches.service';

interface LogEntry {
  batchId?: string;
  creativeId?: string;
  userId?: string;
  action: string;
  details?: any;
}

@Injectable()
export class ActivityLogService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => BatchesService))
    private batchesService: BatchesService,
  ) {}

  async log(entry: LogEntry) {
    return this.prisma.activityLog.create({
      data: {
        batchId: entry.batchId,
        creativeId: entry.creativeId,
        userId: entry.userId,
        action: entry.action,
        details: entry.details ? JSON.stringify(entry.details) : null,
      },
    });
  }

  async findByBatch(batchId: string, userId: string) {
    // Verify batch ownership
    const isOwner = await this.batchesService.verifyOwnership(batchId, userId);
    if (!isOwner) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.activityLog.findMany({
      where: { batchId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
        creative: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCreative(creativeId: string, userId: string) {
    // Get creative to find batch
    const creative = await this.prisma.creative.findUnique({
      where: { id: creativeId },
      select: { batchId: true },
    });

    if (!creative) {
      throw new NotFoundException('Creative not found');
    }

    // Verify batch ownership
    const isOwner = await this.batchesService.verifyOwnership(creative.batchId, userId);
    if (!isOwner) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.activityLog.findMany({
      where: { creativeId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
