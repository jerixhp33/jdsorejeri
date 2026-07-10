-- Add new product types to the ENUM
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'hairband';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'bracelet';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'keychain';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'hair_clip';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'other';
