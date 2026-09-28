import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { tmpdir } from 'os';
import { CreativesService } from './creatives.service';
import { CreativesController } from './creatives.controller';
import { BatchesModule } from '../batches/batches.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationsModule } from '../notifications/notifications.module';

const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (Cloudinary free plan video limit)

@Module({
  imports: [
    BatchesModule,
    ActivityLogModule,
    NotificationsModule,
    // Uploads go to a temp dir on disk (not memory), then StorageService moves them.
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: diskStorage({ destination: tmpdir() }),
        limits: {
          fileSize: Number(configService.get('MAX_FILE_SIZE')) || DEFAULT_MAX_FILE_SIZE,
        },
      }),
    }),
  ],
  controllers: [CreativesController],
  providers: [CreativesService],
  exports: [CreativesService],
})
export class CreativesModule {}
