import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { BatchesService } from '../batches/batches.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ApproveDto } from './dto/approve.dto';
import { RejectDto } from './dto/reject.dto';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private batchesService: BatchesService,
    private activityLogService: ActivityLogService,
  ) {}

  async getBatchByToken(accessToken: string) {
    return this.batchesService.findByAccessToken(accessToken);
  }

  async approve(accessToken: string, approveDto: ApproveDto) {
    const batch = await this.batchesService.findByAccessToken(accessToken);

    const creative = batch.creatives.find((c) => c.id === approveDto.creativeId);
    if (!creative) {
      throw new NotFoundException('Creative not found in this batch');
    }

    if (creative.approval?.status !== 'PENDING') {
      throw new BadRequestException('Creative already has a decision');
    }

    await this.prisma.approval.update({
      where: { creativeId: approveDto.creativeId },
      data: {
        status: 'APPROVED',
        feedbackProvidedAt: new Date(),
      },
    });

    await this.batchesService.updateCounts(batch.id);

    await this.activityLogService.log({
      batchId: batch.id,
      creativeId: approveDto.creativeId,
      action: 'CREATIVE_APPROVED',
      details: { creativeName: creative.name },
    });

    return { success: true, status: 'APPROVED' };
  }

  async reject(accessToken: string, rejectDto: RejectDto) {
    const batch = await this.batchesService.findByAccessToken(accessToken);

    const creative = batch.creatives.find((c) => c.id === rejectDto.creativeId);
    if (!creative) {
      throw new NotFoundException('Creative not found in this batch');
    }

    if (creative.approval?.status !== 'PENDING') {
      throw new BadRequestException('Creative already has a decision');
    }

    await this.prisma.approval.update({
      where: { creativeId: rejectDto.creativeId },
      data: {
        status: 'REJECTED',
        feedbackText: rejectDto.feedback,
        feedbackProvidedAt: new Date(),
      },
    });

    await this.batchesService.updateCounts(batch.id);

    await this.activityLogService.log({
      batchId: batch.id,
      creativeId: rejectDto.creativeId,
      action: 'CREATIVE_REJECTED',
      details: {
        creativeName: creative.name,
        feedback: rejectDto.feedback,
      },
    });

    return { success: true, status: 'REJECTED' };
  }
}
