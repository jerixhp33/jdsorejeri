-- Add cost tracking for accurate analytics

-- 1. Add cost tracking to order_items to snapshot the cost at the time of purchase
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10,2) DEFAULT 0;

-- 2. Add cost_price to poster_sizes (variants) to track different costs for different sizes
ALTER TABLE public.poster_sizes ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2) DEFAULT 0;

-- 3. Backfill order_items costs using the parent product's current cost_price as a fallback
UPDATE public.order_items oi
SET 
  unit_cost = COALESCE((SELECT cost_price FROM public.products p WHERE p.id = oi.product_id), 0),
  total_cost = COALESCE((SELECT cost_price FROM public.products p WHERE p.id = oi.product_id), 0) * oi.quantity
WHERE oi.unit_cost = 0 OR oi.unit_cost IS NULL;

-- 4. Create trigger to automatically snapshot cost_price on new order items
CREATE OR REPLACE FUNCTION set_order_item_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_cost_price NUMERIC(10,2);
BEGIN
  IF NEW.poster_size_id IS NOT NULL THEN
    SELECT cost_price INTO v_cost_price FROM public.poster_sizes WHERE id = NEW.poster_size_id;
  END IF;
  
  IF v_cost_price IS NULL OR v_cost_price = 0 THEN
    SELECT cost_price INTO v_cost_price FROM public.products WHERE id = NEW.product_id;
  END IF;

  NEW.unit_cost := COALESCE(v_cost_price, 0);
  NEW.total_cost := NEW.unit_cost * NEW.quantity;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_order_item_cost ON public.order_items;
CREATE TRIGGER trg_set_order_item_cost
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION set_order_item_cost();
