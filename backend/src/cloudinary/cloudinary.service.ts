import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly ready: boolean;

  constructor(config: ConfigService) {
    const url = config.get<string>('CLOUDINARY_URL');
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');

    if (url && !/[<>]/.test(url)) {
      cloudinary.config({ cloudinary_url: url });
      this.ready = true;
    } else if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.ready = true;
    } else {
      this.ready = false;
    }
  }

  async upload(file?: Express.Multer.File): Promise<{ fileUrl: string; fileName: string }> {
    if (!file) return { fileUrl: '', fileName: '' };
    if (!this.ready) {
      this.logger.warn('Cloudinary not configured; skipping upload');
      return { fileUrl: '', fileName: file.originalname };
    }

    const safe = file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const url = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'taskflow',
          resource_type: 'auto',
          public_id: `${Date.now()}-${safe}`.slice(0, 80),
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              error instanceof Error
                ? error
                : new Error(
                    typeof error?.message === 'string' ? error.message : 'Cloudinary upload failed',
                  ),
            );
          }
          resolve(result.secure_url);
        },
      );
      stream.end(file.buffer);
    });

    return { fileUrl: url, fileName: file.originalname };
  }
}
