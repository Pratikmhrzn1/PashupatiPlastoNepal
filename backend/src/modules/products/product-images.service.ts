import { BadRequestException, Injectable } from '@nestjs/common';
import { put } from '@vercel/blob';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp);base64,(.+)$/i;

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * Stores product images and returns their public URL or path.
 *
 * Images arrive as data URLs (the admin client resizes them before upload),
 * which avoids multipart handling and keeps the API JSON-only.
 *
 * On Vercel the local filesystem is ephemeral, so uploads go to Vercel Blob
 * when BLOB_READ_WRITE_TOKEN is configured. Local development falls back to
 * the `uploads/` directory served by the API.
 */
@Injectable()
export class ProductImagesService {
  private readonly uploadsDir = join(process.cwd(), 'uploads', 'products');

  async saveProductImage(dataUrl: string): Promise<string> {
    const match = DATA_URL_PATTERN.exec(dataUrl);

    if (!match?.[1] || !match[2]) {
      throw new BadRequestException(
        'Unsupported image. Upload a PNG, JPEG or WebP file.',
      );
    }

    const buffer = Buffer.from(match[2], 'base64');

    if (buffer.length === 0) {
      throw new BadRequestException('The uploaded image is empty.');
    }

    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image is too large. Maximum size is 5 MB.');
    }

    const extension = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const filename = `${randomUUID()}.${extension}`;

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      const blob = await put(`products/${filename}`, buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: CONTENT_TYPES[extension],
        token: blobToken,
      });

      return blob.url;
    }

    await mkdir(this.uploadsDir, { recursive: true });
    await writeFile(join(this.uploadsDir, filename), buffer);

    return `/uploads/products/${filename}`;
  }
}
