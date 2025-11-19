import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './config/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { BatchesModule } from './modules/batches/batches.module';
import { CreativesModule } from './modules/creatives/creatives.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    BatchesModule,
    CreativesModule,
    ApprovalsModule,
    ActivityLogModule,
    NotificationsModule,
  ],
})
export class AppModule {}
