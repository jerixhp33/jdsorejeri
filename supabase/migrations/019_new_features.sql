-- 1. Gift Wrapping Fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_message TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_wrap_fee DECIMAL(10,2) DEFAULT 0;

-- 2. Photo Reviews Field
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Product Bundles Field
ALTER TABLE products ADD COLUMN IF NOT EXISTS bundle_product_id UUID REFERENCES products(id);

-- 4. Store Settings for Gift Wrapping
-- Assuming 'store_settings' table exists, if not, we can create it or just insert.
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if they don't exist
INSERT INTO store_settings (key, value, description)
VALUES 
  ('gift_wrapping_enabled', 'true', 'Enable or disable the gift wrapping option at checkout'),
  ('gift_wrapping_fee', '50', 'The flat fee charged for premium gift wrapping')
ON CONFLICT (key) DO NOTHING;

-- Grant permissions for the new settings table
GRANT SELECT ON store_settings TO anon, authenticated;
GRANT ALL ON store_settings TO service_role;
