-- ============================================================
-- LUXE STORE — Allow Video Uploads & Increase Size Limits
-- Updates storage bucket configuration for product-images and banners
-- ============================================================

UPDATE storage.buckets
SET 
  file_size_limit = 52428800, -- 50 MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm']
WHERE id IN ('product-images', 'banners');
