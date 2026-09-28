import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @Get()
  findRecent(@Query('limit') limit?: string, @Query('before') before?: string) {
    const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const beforeDate = before ? new Date(before) : undefined;
    if (beforeDate && Number.isNaN(beforeDate.getTime())) {
      throw new BadRequestException('Invalid "before" date');
    }
    return this.activityLogService.findRecent(take, beforeDate);
  }

  @Get('batch/:batchId')
  findByBatch(@Param('batchId', ParseUUIDPipe) batchId: string) {
    return this.activityLogService.findByBatch(batchId);
  }

  @Get('creative/:creativeId')
  findByCreative(@Param('creativeId', ParseUUIDPipe) creativeId: string) {
    return this.activityLogService.findByCreative(creativeId);
  }
}
