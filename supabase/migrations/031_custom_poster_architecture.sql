-- Migration: 031_custom_poster_architecture.sql
-- Master Custom Poster Architecture & Admin Notification Center

-- 1. Create custom_uploads table for private customer photo metadata
CREATE TABLE IF NOT EXISTS public.custom_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    aspect_ratio NUMERIC NOT NULL,
    quality_status TEXT NOT NULL CHECK (quality_status IN ('excellent', 'good', 'acceptable', 'low')),
    quality_score NUMERIC DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 2. Create custom_image_audit_logs table to record admin view & download actions
CREATE TABLE IF NOT EXISTS public.custom_image_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL,
    custom_upload_id UUID NOT NULL REFERENCES public.custom_uploads(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('VIEWED', 'DOWNLOADED')),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Add is_customizable flag to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN DEFAULT false;

-- 4. Add custom_upload_id to cart_items
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS custom_upload_id UUID REFERENCES public.custom_uploads(id) ON DELETE SET NULL;

-- 5. Add custom metadata snapshot columns to order_items
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS custom_upload_id UUID,
ADD COLUMN IF NOT EXISTS custom_image_path TEXT,
ADD COLUMN IF NOT EXISTS custom_width INTEGER,
ADD COLUMN IF NOT EXISTS custom_height INTEGER,
ADD COLUMN IF NOT EXISTS custom_file_size BIGINT,
ADD COLUMN IF NOT EXISTS custom_resolution TEXT,
ADD COLUMN IF NOT EXISTS poster_size_id TEXT,
ADD COLUMN IF NOT EXISTS frame_choice TEXT;

-- 6. Create notifications table for Email-Inbox Style Admin Notification Center
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL DEFAULT 'custom_order',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id UUID,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Indices for fast lookups
CREATE INDEX IF NOT EXISTS idx_custom_uploads_user ON public.custom_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_upload ON public.custom_image_audit_logs(custom_upload_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read, created_at DESC);

-- Enable RLS
ALTER TABLE public.custom_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_image_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service Role Full Access on custom_uploads" ON public.custom_uploads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users insert own custom uploads" ON public.custom_uploads FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users read own custom uploads" ON public.custom_uploads FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service Role Full Access on audit_logs" ON public.custom_image_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access to audit_logs" ON public.custom_image_audit_logs FOR ALL TO authenticated USING (true);

CREATE POLICY "Service Role Full Access on notifications" ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access on notifications" ON public.notifications FOR ALL TO authenticated USING (true);
