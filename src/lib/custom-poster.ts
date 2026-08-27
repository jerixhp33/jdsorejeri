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
    // 1. Read image dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);

      const analysis = analyzeImageQuality(width, height, file.size);
      const uploadId = crypto.randomUUID();
      const userFolder = userId || 'guest';
      const fileExt = file.name.split('.').pop() || 'jpg';
      const storagePath = `private/${userFolder}/${uploadId}/original.${fileExt}`;

      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hxeayujekyexdpljzdpe.supabase.co';
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      const uploadUrl = `${supabaseUrl}/storage/v1/object/custom_user_uploads/${storagePath}`;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl, true);
      xhr.setRequestHeader('apikey', anonKey);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken || anonKey}`);
      xhr.setRequestHeader('x-upsert', 'true');
      xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Insert DB record into custom_uploads
          try {
            const { data, error } = await supabase
              .from('custom_uploads')
              .insert({
                id: uploadId,
                user_id: userId,
                storage_path: storagePath,
                original_filename: file.name,
                mime_type: file.type || 'image/jpeg',
                file_size: file.size,
                width,
                height,
                aspect_ratio: analysis.aspectRatioNum,
                quality_status: analysis.overallStatus,
                quality_score: Math.round(analysis.sizeRatings.A4.dpi)
              })
              .select('*')
              .single();

            if (error) {
              reject(new Error(`Failed to save upload record: ${error.message}`));
              return;
            }

            resolve({
              record: { ...data, analysis },
              analysis
            });
          } catch (dbErr: any) {
            reject(dbErr);
          }
        } else {
          reject(new Error(`Storage upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload'));
      xhr.send(file);
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
