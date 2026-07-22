-- Migration for enhanced bundling / cross-sells

CREATE TABLE IF NOT EXISTS public.product_cross_sells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cross_sell_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, cross_sell_product_id)
);

-- Enable RLS
ALTER TABLE public.product_cross_sells ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cross-sells
CREATE POLICY "Allow public read access on product_cross_sells" 
ON public.product_cross_sells FOR SELECT USING (true);

-- Allow service role / admin full access (managed by service_role bypass or explicit policy if needed)
-- We rely on the existing grant public TO service_role
GRANT ALL ON public.product_cross_sells TO service_role;
