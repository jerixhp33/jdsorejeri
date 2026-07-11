-- ============================================================
-- WIDEN order_status ENUM
-- ============================================================
-- Add new values that don't exist yet
-- Note: ENUM additions cannot be run in the same transaction 
-- as queries that use them.

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'label_generated';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'shipped';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'return_requested';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'returned';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refund_requested';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';
