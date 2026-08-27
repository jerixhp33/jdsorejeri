-- Migration: 030_whatsapp_chat_messages.sql
-- Permanent WhatsApp Chat Persistence Table

CREATE TABLE IF NOT EXISTS public.whatsapp_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('customer', 'ai', 'admin')),
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by phone_number and creation timestamp
CREATE INDEX IF NOT EXISTS idx_whatsapp_chat_messages_phone 
ON public.whatsapp_chat_messages (phone_number, created_at ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.whatsapp_chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow Service Role full access
CREATE POLICY "Service Role Full Access on whatsapp_chat_messages" 
ON public.whatsapp_chat_messages
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Allow Authenticated Users / Admins to read chat messages
CREATE POLICY "Authenticated Read whatsapp_chat_messages" 
ON public.whatsapp_chat_messages
FOR SELECT 
TO authenticated
USING (true);
