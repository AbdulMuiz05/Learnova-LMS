import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(ApiError.badRequest('Only JPEG, PNG, WebP or GIF images are allowed', 'INVALID_FILE_TYPE'));
      return;
    }
    callback(null, true);
  },
}).single('image');
