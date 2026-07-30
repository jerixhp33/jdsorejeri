-- Add customer_email to abandoned_carts
ALTER TABLE public.abandoned_carts 
ADD COLUMN IF NOT EXISTS customer_email TEXT;
