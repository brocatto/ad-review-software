import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

interface LogEntry {
  batchId?: string;
  creativeId?: string;
  userId?: string;
  action: string;
  details?: any;
}

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

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

  /** Global history, newest first. `before` is the createdAt of the last item of the previous page. */
  async findRecent(limit: number, before?: Date) {
    return this.prisma.activityLog.findMany({
      where: before ? { createdAt: { lt: before } } : undefined,
      include: {
        user: { select: { id: true, fullName: true } },
        creative: { select: { id: true, name: true } },
        batch: {
          select: { id: true, name: true, client: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByBatch(batchId: string) {
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

  async findByCreative(creativeId: string) {
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
