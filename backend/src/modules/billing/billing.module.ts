import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { TrialReminderService } from './trial-reminder.service';

// PrismaModule and EmailModule are global; ScheduleModule is registered in AppModule
@Module({
  imports: [ConfigModule],
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService, TrialReminderService],
  exports: [BillingService],
})
export class BillingModule {}
