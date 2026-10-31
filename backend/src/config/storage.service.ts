import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { basename, extname, join, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CloudinaryService } from './cloudinary.service';

// Never trust the client-supplied filename: only well-known media extensions are
// preserved, anything else is derived from the mimetype (blocks .html-served-as-image)
const EXTENSION_BY_MIMETYPE: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};
const SAFE_EXTENSIONS = new Set([...Object.values(EXTENSION_BY_MIMETYPE), '.jpeg']);

/** Directory for locally stored uploads (also served by main.ts under /uploads). */
export const getUploadDir = (dir?: string): string =>
  resolve(process.cwd(), dir || process.env.UPLOAD_DIR || './uploads');

/**
 * Persists uploaded files. Multer streams each upload to a temp dir first
 * (see creatives.module.ts); this moves it to Cloudinary when configured or to
 * UPLOAD_DIR otherwise, and always removes the temp file.
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
    this.uploadDir = getUploadDir(this.configService.get<string>('UPLOAD_DIR'));

    if (!this.useCloudinary && this.configService.get<string>('NODE_ENV') === 'production') {
      this.logger.warn(
        'Cloudinary não configurado em produção: uploads serão gravados em disco local e não sobrevivem a redeploys/múltiplas instâncias.',
      );
    }
  }

  /** Stores a multer temp file and returns its public URL (Cloudinary) or path (/uploads/...). */
  async save(file: Express.Multer.File): Promise<string> {
    try {
      if (this.useCloudinary) {
        return await this.cloudinaryService.uploadFile(file.path);
      }

      const filename = `${uuidv4()}${this.safeExtension(file)}`;
      await fs.mkdir(this.uploadDir, { recursive: true });
      // copy instead of rename: the temp dir may live on another filesystem
      await fs.copyFile(file.path, join(this.uploadDir, filename));
      return `/uploads/${filename}`;
    } finally {
      await this.discard([file]);
    }
  }

  /** Removes multer temp files (used when a request is rejected before storing). */
  async discard(files: Express.Multer.File[]): Promise<void> {
    await Promise.all(
      files
        .filter((f) => f?.path)
        .map((f) =>
          fs.rm(f.path, { force: true }).catch((err) => {
            this.logger.warn(`Could not remove temp file ${f.path}: ${err}`);
          }),
        ),
    );
  }

  /** Deletes a stored file. Failures are logged, never thrown: the DB row is already gone. */
  async remove(fileUrl: string): Promise<void> {
    try {
      if (fileUrl.startsWith('/uploads/')) {
        // basename() keeps the target inside uploadDir even for crafted paths
        await fs.rm(join(this.uploadDir, basename(fileUrl)), { force: true });
      } else if (this.useCloudinary && fileUrl.includes('cloudinary.com')) {
        await this.cloudinaryService.deleteFile(fileUrl);
      }
    } catch (err) {
      this.logger.warn(`Could not delete file ${fileUrl}: ${err}`);
    }
  }

  private safeExtension(file: Express.Multer.File): string {
    const originalExt = extname(file.originalname || '').toLowerCase();
    return SAFE_EXTENSIONS.has(originalExt)
      ? originalExt
      : EXTENSION_BY_MIMETYPE[file.mimetype] ?? '.bin';
  }
}
