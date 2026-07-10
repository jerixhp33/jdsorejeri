-- Add storage_path to track and cleanly delete files from Supabase storage bucket
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS storage_path TEXT;
