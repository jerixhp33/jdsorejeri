// src/lib/custom-poster.ts
// Upload Engine & Private Supabase Storage Manager for Custom Photo Posters

import { createClient } from '@/lib/supabase/client';
import { analyzeImageQuality, ImageQualityAnalysis } from './image-quality';

export interface CustomUploadRecord {
  id: string;
  user_id: string | null;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  width: number;
  height: number;
  aspect_ratio: number;
  quality_status: 'excellent' | 'good' | 'acceptable' | 'low';
  quality_score: number;
  created_at: string;
  analysis?: ImageQualityAnalysis;
}

/**
 * Uploads customer image to private Supabase Storage bucket 'custom_user_uploads'
 * Uses real XHR progress listener for 0% -> 100% upload animation.
 */
export async function uploadCustomImageWithProgress(
  file: File,
  userId: string | null,
  onProgress: (percent: number) => void
): Promise<{ record: CustomUploadRecord; analysis: ImageQualityAnalysis }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);

      const formData = new FormData();
      formData.append('file', file);
      if (userId) formData.append('userId', userId);
      formData.append('width', width.toString());
      formData.append('height', height.toString());

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/custom-poster/upload', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.error) {
              reject(new Error(data.error));
            } else {
              resolve(data);
            }
          } catch (e: any) {
            reject(new Error('Failed to parse upload server response'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload'));
      xhr.send(formData);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file. Please upload a valid JPG, PNG, or WEBP photo.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Creates short-lived signed URL (1 hour) for private image viewing
 */
export async function createSignedImageUrl(storagePath: string, expiresSeconds: number = 3600): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('custom_user_uploads')
    .createSignedUrl(storagePath, expiresSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Failed to generate signed image URL');
  }
  return data.signedUrl;
}

/**
 * Creates short-lived signed URL (1 hour) with download attachment header
 */
export async function createSignedDownloadUrl(
  storagePath: string,
  downloadFilename: string,
  expiresSeconds: number = 3600
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('custom_user_uploads')
    .createSignedUrl(storagePath, expiresSeconds, {
      download: downloadFilename
    });

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Failed to generate signed download URL');
  }
  return data.signedUrl;
}
