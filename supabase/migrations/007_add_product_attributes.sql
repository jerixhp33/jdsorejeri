-- Add generic JSONB attributes column for infinite product scaling
ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;
