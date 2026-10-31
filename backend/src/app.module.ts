import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './config/prisma.module';
import { StorageModule } from './config/storage.module';
import { HealthController } from './health.controller';
import { EmailModule } from './modules/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { BatchesModule } from './modules/batches/batches.module';
import { CreativesModule } from './modules/creatives/creatives.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 300, // per client IP (see trust proxy in main.ts); auth routes have stricter limits
    }]),
    PrismaModule,
    StorageModule,
    EmailModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    BatchesModule,
    CreativesModule,
    ApprovalsModule,
    ActivityLogModule,
    NotificationsModule,
    BillingModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
