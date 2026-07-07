-- ============================================================
-- LUXE STORE — Supabase Storage Buckets & Policies v2
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Create buckets (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', TRUE,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']),
  ('banners',        'banners',        TRUE,  10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('user-avatars',   'user-avatars',   TRUE,  2097152,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ─── product-images ───
DROP POLICY IF EXISTS "product_images_public_select" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_insert"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_update"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_delete"  ON storage.objects;

CREATE POLICY "product_images_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT role FROM user_profiles WHERE uid = auth.uid()::TEXT LIMIT 1) IN ('admin','super_admin')
  );

CREATE POLICY "product_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND (SELECT role FROM user_profiles WHERE uid = auth.uid()::TEXT LIMIT 1) IN ('admin','super_admin')
  );

CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (SELECT role FROM user_profiles WHERE uid = auth.uid()::TEXT LIMIT 1) IN ('admin','super_admin')
  );

-- ─── banners ───
DROP POLICY IF EXISTS "banners_public_select" ON storage.objects;
DROP POLICY IF EXISTS "banners_admin_all"     ON storage.objects;

CREATE POLICY "banners_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "banners_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banners'
    AND (SELECT role FROM user_profiles WHERE uid = auth.uid()::TEXT LIMIT 1) IN ('admin','super_admin')
  );

CREATE POLICY "banners_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'banners'
    AND (SELECT role FROM user_profiles WHERE uid = auth.uid()::TEXT LIMIT 1) IN ('admin','super_admin')
  );

CREATE POLICY "banners_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banners'
    AND (SELECT role FROM user_profiles WHERE uid = auth.uid()::TEXT LIMIT 1) IN ('admin','super_admin')
  );

-- ─── user-avatars ───
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_insert"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_update"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_delete"   ON storage.objects;

CREATE POLICY "avatars_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

CREATE POLICY "avatars_user_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "avatars_user_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "avatars_user_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
