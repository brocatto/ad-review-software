import { BadRequestException, Module } from '@nestjs/common';
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

const mediaFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Apenas imagens e vídeos são permitidos'), false);
  }
};

@Module({
  imports: [
    BatchesModule,
    ActivityLogModule,
    NotificationsModule,
    // Uploads are streamed to a temp dir on disk (not buffered in memory);
    // StorageService then moves them to Cloudinary or UPLOAD_DIR.
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: diskStorage({ destination: tmpdir() }),
        limits: {
          fileSize: Number(configService.get('MAX_FILE_SIZE')) || DEFAULT_MAX_FILE_SIZE,
        },
        fileFilter: mediaFileFilter,
      }),
    }),
  ],
  controllers: [CreativesController],
  providers: [CreativesService],
  exports: [CreativesService],
})
export class CreativesModule {}
