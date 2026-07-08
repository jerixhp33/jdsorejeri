ALTER TABLE public.delivery_addresses ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.delivery_addresses ADD COLUMN IF NOT EXISTS longitude NUMERIC;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT DEFAULT 'ST Courier';
