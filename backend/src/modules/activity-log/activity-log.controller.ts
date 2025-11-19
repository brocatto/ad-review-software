import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @Get('batch/:batchId')
  findByBatch(@Param('batchId') batchId: string) {
    return this.activityLogService.findByBatch(batchId);
  }

  @Get('creative/:creativeId')
  findByCreative(@Param('creativeId') creativeId: string) {
    return this.activityLogService.findByCreative(creativeId);
  }
}
