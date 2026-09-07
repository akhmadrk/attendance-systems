import { BadRequestException } from '@nestjs/common';
import { FILE_UPLOAD } from '@attendance/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { extname, join } from 'path';

function photoUploadDir(): string {
  return join(process.cwd(), process.env.UPLOAD_DIR ?? './uploads', 'photos');
}

export function createMulterOptions(): MulterOptions {
  const dir = photoUploadDir();
  fs.mkdirSync(dir, { recursive: true });

  return {
    storage: diskStorage({
      destination: dir,
      filename: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `${randomUUID()}${ext}`);
      },
    }),
    limits: { fileSize: FILE_UPLOAD.MAX_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      const allowedExt = FILE_UPLOAD.ALLOWED_EXTENSIONS.includes(ext);
      const allowedMime = FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype);
      if (allowedExt && allowedMime) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(
            'Invalid file type. Allowed: JPG, PNG, WEBP',
          ),
          false,
        );
      }
    },
  };
}
