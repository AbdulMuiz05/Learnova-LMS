import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { env } from './env';

const configured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (configured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const isCloudinaryConfigured = (): boolean => configured;

export interface UploadSignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  resourceType: 'image' | 'video';
  type: 'upload' | 'authenticated';
  uploadUrl: string;
}

export function createUploadSignature(
  folder: string,
  resourceType: 'image' | 'video' = 'image'
): UploadSignature {
  if (!configured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
  }
  const type = resourceType === 'video' ? 'authenticated' : 'upload';
  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = {
    timestamp,
    folder,
    type,
  };
  const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET as string);
  return {
    timestamp,
    signature,
    apiKey: env.CLOUDINARY_API_KEY as string,
    cloudName: env.CLOUDINARY_CLOUD_NAME as string,
    folder,
    resourceType,
    type,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
  };
}

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: string
): Promise<UploadApiResponse> {
  if (!configured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
  }
  return new Promise((resolve, reject) => {
    const options: UploadApiOptions = { folder, resource_type: 'image' };
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error('Cloudinary upload failed'));
        return;
      }
      resolve(result);
    });
    stream.end(buffer);
  });
}

export function signVideoUrl(
  publicId: string,
  type: 'upload' | 'authenticated' = 'authenticated'
): string {
  if (!configured) return '';
  return cloudinary.url(publicId, {
    resource_type: 'video',
    type,
    sign_url: true,
    secure: true,
    fetch_format: 'auto',
  });
}

export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: 'image' | 'video' = 'image',
  type: 'upload' | 'authenticated' = 'upload'
): Promise<void> {
  if (!configured || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type,
      invalidate: true,
    });
  } catch {
    // Asset deletion failures should not break the request.
  }
}
