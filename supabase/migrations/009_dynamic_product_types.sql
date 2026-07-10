-- Convert product_type from ENUM to TEXT for infinite custom types
ALTER TABLE products ALTER COLUMN product_type TYPE TEXT USING product_type::text;
ALTER TABLE product_categories ALTER COLUMN product_type TYPE TEXT USING product_type::text;

-- We intentionally do not DROP TYPE product_type here just in case any other views depend on it,
-- but the main tables are now freed from the ENUM constraint.
