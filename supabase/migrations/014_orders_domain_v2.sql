-- ============================================================
-- JD Store v1.1 — Orders Domain V2 Migration
-- ============================================================
-- This migration:
--   1. Widens the order_status enum to support the full lifecycle
--   2. Adds missing columns to the orders table
--   3. Creates order_events, payments, shipments, returns, refunds tables
--   4. Sets up RLS policies
--   5. Backfills existing data
-- ============================================================



-- Migrate 'ready' → 'out_for_delivery' for existing rows
-- Note: Postgres doesn't allow removing enum values, so 'ready' stays in the enum
-- but we migrate all data away from it
UPDATE orders SET status = 'out_for_delivery' WHERE status = 'ready';

-- ============================================================
-- 2. ADD MISSING COLUMNS TO orders TABLE
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'unfulfilled';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS grand_total NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS internal_tags TEXT[];

-- Backfill: set grand_total = total and shipping_cost = delivery_charge for existing rows
UPDATE orders SET grand_total = total WHERE grand_total IS NULL;
UPDATE orders SET shipping_cost = delivery_charge WHERE shipping_cost IS NULL;
-- Set payment_status based on current order status
UPDATE orders SET payment_status = 'paid' WHERE status IN ('confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered');
-- Set fulfillment_status based on current order status
UPDATE orders SET fulfillment_status = 'delivered' WHERE status = 'delivered';
UPDATE orders SET fulfillment_status = 'shipped' WHERE status IN ('shipped', 'out_for_delivery');
UPDATE orders SET fulfillment_status = 'packed' WHERE status = 'packed';
UPDATE orders SET fulfillment_status = 'processing' WHERE status IN ('confirmed', 'processing');

-- ============================================================
-- 3. CREATE order_events TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  actor_type TEXT DEFAULT 'system' CHECK (actor_type IN ('system', 'admin', 'customer', 'courier')),
  performed_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id, created_at DESC);

-- ============================================================
-- 4. CREATE payments TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT,
  transaction_id TEXT,
  payment_method TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'partially_refunded', 'refunded')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- ============================================================
-- 5. CREATE shipments TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'ST Courier',
  provider_reference TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'label_generated', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned')),
  shipping_cost NUMERIC(10,2),
  package_weight NUMERIC(8,2),
  estimated_delivery DATE,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  label_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);

-- ============================================================
-- 6. CREATE returns TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'received', 'inspected')),
  reason TEXT,
  photos TEXT[],
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);

-- ============================================================
-- 7. CREATE refunds TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  return_id UUID REFERENCES returns(id),
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'refunded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);

-- ============================================================
-- 8. RLS POLICIES
-- ============================================================

-- order_events
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to order_events"
  ON order_events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE uid = auth.uid()::text AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Customers can view own order events"
  ON order_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN user_profiles up ON up.id = o.user_id
      WHERE o.id = order_events.order_id AND up.uid = auth.uid()::text
    )
  );

-- payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to payments"
  ON payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE uid = auth.uid()::text AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Customers can view own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN user_profiles up ON up.id = o.user_id
      WHERE o.id = payments.order_id AND up.uid = auth.uid()::text
    )
  );

-- shipments
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to shipments"
  ON shipments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE uid = auth.uid()::text AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Customers can view own shipments"
  ON shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN user_profiles up ON up.id = o.user_id
      WHERE o.id = shipments.order_id AND up.uid = auth.uid()::text
    )
  );

-- returns
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to returns"
  ON returns FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE uid = auth.uid()::text AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Customers can manage own returns"
  ON returns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN user_profiles up ON up.id = o.user_id
      WHERE o.id = returns.order_id AND up.uid = auth.uid()::text
    )
  );

-- refunds
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to refunds"
  ON refunds FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE uid = auth.uid()::text AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Customers can view own refunds"
  ON refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN user_profiles up ON up.id = o.user_id
      WHERE o.id = refunds.order_id AND up.uid = auth.uid()::text
    )
  );

-- ============================================================
-- 9. AUTO-CREATE order_event ON NEW ORDER
-- ============================================================
CREATE OR REPLACE FUNCTION fn_order_created_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_events (order_id, event_type, title, description, actor_type)
  VALUES (
    NEW.id,
    'order_created',
    'Order Placed',
    'Order #' || NEW.order_number || ' was placed successfully.',
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_created_event ON orders;
CREATE TRIGGER trg_order_created_event
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_order_created_event();
