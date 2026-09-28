import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { extname, join, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CloudinaryService } from './cloudinary.service';

/**
 * Persists uploaded files. Multer writes uploads to a temp dir first
 * (see creatives.module.ts); this moves them to Cloudinary when configured,
 * or to the local upload dir otherwise, and always removes the temp file.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  readonly useCloudinary: boolean;
  readonly uploadDir: string;

  constructor(
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
  ) {
    this.useCloudinary = !!this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    this.uploadDir = resolve(this.configService.get<string>('UPLOAD_DIR') || './uploads');
  }

  async save(file: Express.Multer.File): Promise<string> {
    try {
      if (this.useCloudinary) {
        return await this.cloudinaryService.uploadFile(file.path);
      }

      const filename = `${uuidv4()}${extname(file.originalname).toLowerCase()}`;
      await fs.mkdir(this.uploadDir, { recursive: true });
      // copy instead of rename: the temp dir may be on another filesystem
      await fs.copyFile(file.path, join(this.uploadDir, filename));
      return `/uploads/${filename}`;
    } finally {
      await fs.rm(file.path, { force: true }).catch((err) => {
        this.logger.warn(`Could not remove temp file ${file.path}: ${err}`);
      });
    }
  }

  async remove(fileUrl: string): Promise<void> {
    try {
      if (fileUrl.startsWith('/uploads/')) {
        await fs.rm(join(this.uploadDir, fileUrl.slice('/uploads/'.length)), { force: true });
      } else if (this.useCloudinary && fileUrl.includes('cloudinary.com')) {
        await this.cloudinaryService.deleteFile(fileUrl);
      }
    } catch (err) {
      this.logger.warn(`Could not delete file ${fileUrl}: ${err}`);
    }
  }
}
