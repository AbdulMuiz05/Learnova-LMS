import { Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';
import {
  createUploadSignature,
  isCloudinaryConfigured,
  uploadImageBuffer,
} from '../config/cloudinary';
import { env } from '../config/env';

const ALLOWED_FOLDERS = new Set(['courses', 'videos', 'hero', 'avatars']);

export const getUploadStatus = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    cloudinary: isCloudinaryConfigured(),
    folders: Array.from(ALLOWED_FOLDERS),
    maxImageSizeMb: 5,
    note: isCloudinaryConfigured()
      ? 'Signed uploads are enabled for images and authenticated videos.'
      : 'Add Cloudinary credentials to enable media uploads. External video URLs still work.',
  });
});

export const createSignature = asyncHandler(async (req: Request, res: Response) => {
  const resourceType = req.body.resourceType === 'video' ? 'video' : 'image';
  const folderInput = String(req.body.folder ?? (resourceType === 'video' ? 'videos' : 'courses'));
  if (!ALLOWED_FOLDERS.has(folderInput)) {
    throw ApiError.badRequest('Unsupported upload folder', 'INVALID_FOLDER');
  }
  if (!isCloudinaryConfigured()) {
    throw ApiError.serviceUnavailable(
      'Cloudinary is not configured on the server. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, or use an external video URL.',
      'CLOUDINARY_NOT_CONFIGURED'
    );
  }

  const signature = createUploadSignature(`${env.CLOUDINARY_FOLDER}/${folderInput}`, resourceType);
  sendSuccess(res, signature);
});

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No image file was provided', 'FILE_REQUIRED');
  if (!isCloudinaryConfigured()) {
    throw ApiError.serviceUnavailable(
      'Cloudinary is not configured on the server. Add your Cloudinary credentials to enable uploads.',
      'CLOUDINARY_NOT_CONFIGURED'
    );
  }
  const folderInput = ALLOWED_FOLDERS.has(String(req.body.folder)) ? String(req.body.folder) : 'courses';
  const uploaded = await uploadImageBuffer(req.file.buffer, `${env.CLOUDINARY_FOLDER}/${folderInput}`);
  sendSuccess(res, {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    width: uploaded.width,
    height: uploaded.height,
  });
});
