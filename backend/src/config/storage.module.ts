import { Module, Global } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [CloudinaryService, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
