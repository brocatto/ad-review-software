import { Module, forwardRef } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [forwardRef(() => ActivityLogModule), NotificationsModule, ClientsModule],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
