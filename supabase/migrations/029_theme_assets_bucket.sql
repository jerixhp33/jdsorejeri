-- ============================================================
-- LUXE STORE — Create Theme Assets Bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'theme-assets', 
  'theme-assets', 
  TRUE,  
  52428800, -- 50 MB 
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif','video/mp4','video/webm']
)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif','video/mp4','video/webm'];

-- Policies for theme-assets
DROP POLICY IF EXISTS "theme_assets_public_select" ON storage.objects;
DROP POLICY IF EXISTS "theme_assets_admin_insert"  ON storage.objects;
DROP POLICY IF EXISTS "theme_assets_admin_update"  ON storage.objects;
DROP POLICY IF EXISTS "theme_assets_admin_delete"  ON storage.objects;

CREATE POLICY "theme_assets_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'theme-assets');

CREATE POLICY "theme_assets_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'theme-assets'
    AND (SELECT role FROM user_profiles WHERE uid = auth.uid()::TEXT LIMIT 1) IN ('admin','super_admin')
  );

CREATE POLICY "theme_assets_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'theme-assets'
    AND (SELECT role FROM user_profiles WHERE uid = auth.uid()::TEXT LIMIT 1) IN ('admin','super_admin')
  );

CREATE POLICY "theme_assets_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'theme-assets'
    AND (SELECT role FROM user_profiles WHERE uid = auth.uid()::TEXT LIMIT 1) IN ('admin','super_admin')
  );
