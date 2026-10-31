import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  /** History across every batch owned by the user, newest first, paginated by `before`. */
  @Get()
  findRecent(
    @Query('limit') limit: string | undefined,
    @Query('before') before: string | undefined,
    @Request() req: any,
  ) {
    const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const beforeDate = before ? new Date(before) : undefined;
    if (beforeDate && Number.isNaN(beforeDate.getTime())) {
      throw new BadRequestException('Parâmetro "before" inválido');
    }
    return this.activityLogService.findRecent(req.user.id, take, beforeDate);
  }

  @Get('batch/:batchId')
  findByBatch(@Param('batchId', ParseUUIDPipe) batchId: string, @Request() req: any) {
    return this.activityLogService.findByBatch(batchId, req.user.id);
  }

  @Get('creative/:creativeId')
  findByCreative(@Param('creativeId', ParseUUIDPipe) creativeId: string, @Request() req: any) {
    return this.activityLogService.findByCreative(creativeId, req.user.id);
  }
}
