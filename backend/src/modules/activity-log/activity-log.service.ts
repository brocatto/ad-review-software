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

const USER_SELECT = { select: { id: true, fullName: true } };
const CREATIVE_SELECT = { select: { id: true, name: true } };

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

  /**
   * Global history limited to batches the user owns, newest first.
   * `before` is the createdAt of the last item of the previous page (keyset pagination).
   */
  async findRecent(userId: string, limit: number, before?: Date) {
    return this.prisma.activityLog.findMany({
      where: {
        batch: { createdByUserId: userId },
        ...(before ? { createdAt: { lt: before } } : {}),
      },
      include: {
        user: USER_SELECT,
        creative: CREATIVE_SELECT,
        batch: {
          select: { id: true, name: true, client: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByBatch(batchId: string, userId: string) {
    // Verify batch ownership
    const isOwner = await this.batchesService.verifyOwnership(batchId, userId);
    if (!isOwner) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.activityLog.findMany({
      where: { batchId },
      include: { user: USER_SELECT, creative: CREATIVE_SELECT },
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
      throw new NotFoundException('Criativo não encontrado');
    }

    // Verify batch ownership
    const isOwner = await this.batchesService.verifyOwnership(creative.batchId, userId);
    if (!isOwner) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.activityLog.findMany({
      where: { creativeId },
      include: { user: USER_SELECT },
      orderBy: { createdAt: 'desc' },
    });
  }
}
