import { Module } from '@nestjs/common';
import { CreativesService } from './creatives.service';
import { CreativesController } from './creatives.controller';
import { BatchesModule } from '../batches/batches.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [BatchesModule, ActivityLogModule, NotificationsModule],
  controllers: [CreativesController],
  providers: [CreativesService],
  exports: [CreativesService],
})
export class CreativesModule {}
