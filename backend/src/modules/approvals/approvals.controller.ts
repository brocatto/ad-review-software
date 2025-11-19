import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ApproveDto } from './dto/approve.dto';
import { RejectDto } from './dto/reject.dto';

@Controller('public')
export class ApprovalsController {
  constructor(private approvalsService: ApprovalsService) {}

  @Get('batch/:accessToken')
  getBatch(@Param('accessToken') accessToken: string) {
    return this.approvalsService.getBatchByToken(accessToken);
  }

  @Post('batch/:accessToken/approve')
  approve(@Param('accessToken') accessToken: string, @Body() approveDto: ApproveDto) {
    return this.approvalsService.approve(accessToken, approveDto);
  }

  @Post('batch/:accessToken/reject')
  reject(@Param('accessToken') accessToken: string, @Body() rejectDto: RejectDto) {
    return this.approvalsService.reject(accessToken, rejectDto);
  }
}
