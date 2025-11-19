import { Module } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ApprovalsController } from './approvals.controller';
import { BatchesModule } from '../batches/batches.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [BatchesModule, ActivityLogModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
