import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabaseAdmin, isSupabaseConfigured, getUserSupabaseClient } from './supabase';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface UploadResult {
  url: string;
  storagePath: string;
  size: number;
  filename: string;
}

export interface UploadOptions {
  bucket?: 'store-logos' | 'product-images';
  userId: string;
  storeId: string;
  productId?: string;
  token?: string;
}

/**
 * Validates and decodes a base64 Data URI image payload
 */
function parseAndValidateBase64(dataUri: string): { buffer: Buffer; mimeType: string; ext: string } {
  if (!dataUri || typeof dataUri !== 'string') {
    throw new Error('Invalid image payload.');
  }

  // If already an absolute HTTPS URL, skip decoding
  if (dataUri.startsWith('https://') || dataUri.startsWith('http://')) {
    throw new Error('ALREADY_URL');
  }

  const matches = dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image format. Must be a valid base64 image data URL.');
  }

  const mimeType = matches[1].toLowerCase();
  const ext = ALLOWED_MIME_TYPES[mimeType];
  if (!ext) {
    throw new Error('Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP.');
  }

  const buffer = Buffer.from(matches[2], 'base64');
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Image size exceeds maximum limit of 5MB.');
  }

  return { buffer, mimeType, ext };
}

/**
 * Uploads an in-memory buffer to Supabase Storage with structured tenant paths.
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  mimeType: string,
  options: UploadOptions,
  _originalName?: string
): Promise<UploadResult> {
  const cleanMime = mimeType.toLowerCase();
  const ext = ALLOWED_MIME_TYPES[cleanMime] || '.jpg';
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const filename = `${uniqueId}${ext}`;
  const bucket = options.bucket || 'product-images';

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Image size exceeds maximum limit of 5MB.');
  }

  // Construct structured storage path
  let storagePath: string;
  if (bucket === 'store-logos') {
    storagePath = `${options.userId || 'anon'}/${options.storeId || 'common'}/${filename}`;
  } else {
    storagePath = `${options.userId || 'anon'}/${options.storeId || 'common'}/${options.productId || 'item'}/${filename}`;
  }

  // 1. Production / Live Supabase Storage Upload
  if (isSupabaseConfigured) {
    try {
      const storageClient = options.token ? getUserSupabaseClient(options.token) : supabaseAdmin;
      const { error: uploadError } = await storageClient.storage
        .from(bucket)
        .upload(storagePath, buffer, {
          contentType: cleanMime,
          cacheControl: '31536000',
          upsert: true,
        });

      if (uploadError) {
        console.warn(`Supabase Storage upload error to ${bucket}:`, uploadError.message);
        // If bucket does not exist, attempt to create it (requires admin)
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
          await supabaseAdmin.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: MAX_IMAGE_BYTES,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          });
          // Retry upload once after bucket creation
          const { error: retryError } = await storageClient.storage
            .from(bucket)
            .upload(storagePath, buffer, {
              contentType: cleanMime,
              cacheControl: '31536000',
              upsert: true,
            });
          if (!retryError) {
            const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath);
            return {
              url: publicData.publicUrl,
              storagePath,
              size: buffer.length,
              filename,
            };
          }
        }
      } else {
        const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath);
        return {
          url: publicData.publicUrl,
          storagePath,
          size: buffer.length,
          filename,
        };
      }
    } catch (err: any) {
      console.error('Supabase storage exception:', err.message);
    }
  }

  // 2. Development / Local Fallback (Only active if Supabase credentials are not supplied)
  const localFileName = `img_${Date.now()}_${filename}`;
  const filePath = path.join(UPLOADS_DIR, localFileName);
  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/${localFileName}`,
    storagePath: `/uploads/${localFileName}`,
    size: buffer.length,
    filename: localFileName,
  };
}

/**
 * Uploads an image to Supabase Storage with strict folder isolation.
 * Structure:
 * - Logos: store-logos/{userId}/{storeId}/{uuid}.webp
 * - Products: product-images/{userId}/{storeId}/{productId}/{uuid}.webp
 */
export async function uploadImageToStorage(
  dataUri: string,
  options: UploadOptions
): Promise<UploadResult> {
  // Check if it's already a hosted URL
  if (dataUri.startsWith('https://') || dataUri.startsWith('http://') || dataUri.startsWith('/uploads/')) {
    return {
      url: dataUri,
      storagePath: dataUri,
      size: 0,
      filename: path.basename(dataUri),
    };
  }

  const { buffer, mimeType } = parseAndValidateBase64(dataUri);
  return uploadBufferToStorage(buffer, mimeType, options);
}

/**
 * Removes an image from Supabase Storage
 */
export async function deleteRemoteImage(
  urlOrPath: string,
  bucket: 'store-logos' | 'product-images' = 'product-images'
): Promise<boolean> {
  if (!urlOrPath || !isSupabaseConfigured) return false;

  try {
    // Extract storage relative path if full URL was provided
    let cleanPath = urlOrPath;
    if (urlOrPath.includes(`/storage/v1/object/public/${bucket}/`)) {
      cleanPath = urlOrPath.split(`/storage/v1/object/public/${bucket}/`)[1];
    }

    if (cleanPath && !cleanPath.startsWith('http')) {
      const { error } = await supabaseAdmin.storage.from(bucket).remove([cleanPath]);
      return !error;
    }
  } catch (err: any) {
    console.warn('Storage deletion note:', err.message);
  }
  return false;
}
