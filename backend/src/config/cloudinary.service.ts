import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(path: string): Promise<string> {
    const result = await cloudinary.uploader.upload(path, {
      folder: 'ad-review',
      resource_type: 'auto',
    });
    return result.secure_url;
  }

  async deleteFile(url: string): Promise<void> {
    // URL: .../<resource_type>/upload/v123/ad-review/<id>.<ext>
    const resourceType = url.includes('/video/upload/') ? 'video' : 'image';
    const publicId = url.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '');
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }
}
