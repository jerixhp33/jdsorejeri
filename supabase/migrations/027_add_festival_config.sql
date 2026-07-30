-- Add JSONB config column to festivals table
ALTER TABLE public.festivals 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;
