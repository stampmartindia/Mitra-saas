import { supabase, isSupabaseConfigured } from './supabase';
import { api } from './api';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImageFile(file: File): void {
  if (!file) {
    throw new Error('No image file selected.');
  }

  const mime = (file.type || '').toLowerCase();
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const validExts = ['jpg', 'jpeg', 'png', 'webp'];

  if (!ALLOWED_MIME_TYPES.includes(mime) && !validExts.includes(ext)) {
    throw new Error('Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Image file size exceeds the 5MB limit. Please choose a smaller image.');
  }
}

/**
 * Uploads an image file directly to Supabase Storage with graceful backend multipart fallback.
 * Guarantees a remote public URL is returned.
 */
export async function uploadImageFile(
  file: File,
  bucket: 'store-logos' | 'product-images' = 'product-images',
  options?: {
    storeId?: string;
    productId?: string;
    userId?: string;
  }
): Promise<{ url: string; storagePath: string }> {
  validateImageFile(file);

  const cleanExt = (file.name.split('.').pop() || 'webp').toLowerCase();
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const filename = `${uniqueId}.${cleanExt}`;

  // 1. Direct Supabase Storage upload via frontend SDK
  if (isSupabaseConfigured) {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data?.user?.id || options?.userId || 'anon';
      const storeId = options?.storeId || 'common';

      let filePath: string;
      if (bucket === 'store-logos') {
        filePath = `${userId}/${storeId}/${filename}`;
      } else {
        filePath = `${userId}/${storeId}/${options?.productId || 'item'}/${filename}`;
      }

      const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '31536000',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

      if (!error && data) {
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (publicData?.publicUrl) {
          return {
            url: publicData.publicUrl,
            storagePath: filePath,
          };
        }
      } else if (error) {
        console.warn(`[Supabase Storage Direct Upload Notice]: ${error.message}. Trying server upload route...`);
      }
    } catch (err: any) {
      console.warn('[Supabase Storage Direct Upload Exception]:', err.message);
    }
  }

  // 2. Server-side multipart upload fallback (which uses supabaseAdmin or local dev storage)
  return await api.uploadImageFile(file, bucket, options?.storeId, options?.productId);
}

/**
 * Cleans up an uploaded image from Supabase Storage if a seller removes a product before finishing onboarding.
 */
export async function deleteStorageFile(
  urlOrPath: string,
  bucket: 'store-logos' | 'product-images' = 'product-images'
): Promise<void> {
  if (!urlOrPath || urlOrPath.startsWith('data:') || !urlOrPath.includes(bucket)) return;

  try {
    let cleanPath = urlOrPath;
    if (urlOrPath.includes(`/storage/v1/object/public/${bucket}/`)) {
      cleanPath = urlOrPath.split(`/storage/v1/object/public/${bucket}/`)[1];
    }
    if (cleanPath && isSupabaseConfigured && !cleanPath.startsWith('http')) {
      await supabase.storage.from(bucket).remove([cleanPath]);
    }
  } catch (e) {
    console.warn('Could not remove storage file:', e);
  }
}
