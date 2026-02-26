import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @Get('batch/:batchId')
  findByBatch(@Param('batchId') batchId: string, @Request() req: any) {
    return this.activityLogService.findByBatch(batchId, req.user.id);
  }

  @Get('creative/:creativeId')
  findByCreative(@Param('creativeId') creativeId: string, @Request() req: any) {
    return this.activityLogService.findByCreative(creativeId, req.user.id);
  }
}
