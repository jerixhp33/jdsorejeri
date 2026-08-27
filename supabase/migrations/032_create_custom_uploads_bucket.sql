-- 1. Create private storage bucket for custom photo posters
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('custom_user_uploads', 'custom_user_uploads', false, 26214400, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for custom_user_uploads
-- Note: 'storage.objects' is the table for files within buckets
CREATE POLICY "Service Role Full Access on custom_user_uploads objects" 
ON storage.objects FOR ALL TO service_role 
USING (bucket_id = 'custom_user_uploads') 
WITH CHECK (bucket_id = 'custom_user_uploads');

-- We don't need anon/authenticated upload policies because uploads happen server-side via the /api/custom-poster/upload route using the service_role key.
