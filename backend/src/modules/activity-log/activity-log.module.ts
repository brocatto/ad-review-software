import { Module, forwardRef } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import { BatchesModule } from '../batches/batches.module';

@Module({
  imports: [forwardRef(() => BatchesModule)],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
