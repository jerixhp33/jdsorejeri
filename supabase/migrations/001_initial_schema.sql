-- ============================================================
-- LUXE STORE — Complete Supabase Schema v2 (corrected)
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_type AS ENUM ('poster', 'earring');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'packed', 'ready', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE poster_finish AS ENUM ('matte', 'glossy', 'satin', 'metallic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE poster_orientation AS ENUM ('portrait', 'landscape', 'square');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('order', 'product', 'offer', 'system', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('draft', 'sent', 'scheduled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE banner_position AS ENUM ('hero', 'top', 'middle', 'bottom', 'sidebar');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid         TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  profile_picture TEXT,
  role        user_role NOT NULL DEFAULT 'user',
  phone       TEXT,
  last_active TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_uid   ON user_profiles(uid);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role  ON user_profiles(role);

-- login_logs
CREATE TABLE IF NOT EXISTS login_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device     TEXT,
  browser    TEXT,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_time ON login_logs(login_time DESC);

-- product_categories
CREATE TABLE IF NOT EXISTS product_categories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  image_url    TEXT,
  product_type product_type NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_type ON product_categories(product_type);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON product_categories(slug);

-- products
CREATE TABLE IF NOT EXISTS products (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                 TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  description          TEXT NOT NULL DEFAULT '',
  product_type         product_type NOT NULL,
  category_id          UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  tags                 TEXT[] NOT NULL DEFAULT '{}',
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured          BOOLEAN NOT NULL DEFAULT FALSE,
  is_trending          BOOLEAN NOT NULL DEFAULT FALSE,
  is_best_seller       BOOLEAN NOT NULL DEFAULT FALSE,
  material             TEXT,
  finish               poster_finish,
  orientation          poster_orientation,
  custom_size_available BOOLEAN DEFAULT FALSE,
  color                TEXT,
  weight_grams         NUMERIC(6,2),
  price                NUMERIC(10,2),
  stock                INTEGER DEFAULT 0,
  sku                  TEXT,
  average_rating       NUMERIC(3,2) DEFAULT 0,
  review_count         INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug     ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_type     ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_tags     ON products USING GIN (tags);

-- poster_sizes
CREATE TABLE IF NOT EXISTS poster_sizes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  width_cm   NUMERIC(6,2) NOT NULL,
  height_cm  NUMERIC(6,2) NOT NULL,
  price      NUMERIC(10,2) NOT NULL,
  stock      INTEGER NOT NULL DEFAULT 0,
  sku        TEXT NOT NULL DEFAULT '',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poster_sizes_product ON poster_sizes(product_id);

-- product_images
CREATE TABLE IF NOT EXISTS product_images (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  alt_text      TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- carts (one cart per user)
CREATE TABLE IF NOT EXISTS carts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);

-- cart_items
CREATE TABLE IF NOT EXISTS cart_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id        UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  poster_size_id UUID REFERENCES poster_sizes(id) ON DELETE SET NULL,
  quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price     NUMERIC(10,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart    ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

-- wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);

-- delivery_addresses
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  alternate_phone TEXT,
  house_no        TEXT NOT NULL,
  street          TEXT NOT NULL,
  area            TEXT NOT NULL,
  city            TEXT NOT NULL,
  district        TEXT NOT NULL,
  pincode         TEXT NOT NULL,
  landmark        TEXT,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON delivery_addresses(user_id);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number        TEXT NOT NULL UNIQUE,
  user_id             UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  status              order_status NOT NULL DEFAULT 'pending',
  delivery_address_id UUID REFERENCES delivery_addresses(id) ON DELETE SET NULL,
  subtotal            NUMERIC(10,2) NOT NULL,
  delivery_charge     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total               NUMERIC(10,2) NOT NULL,
  delivery_notes      TEXT,
  delivery_instructions TEXT,
  whatsapp_sent       BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_message    TEXT,
  admin_notes         TEXT,
  cancelled_reason    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number  ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- order_items
CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  poster_size_id UUID REFERENCES poster_sizes(id) ON DELETE SET NULL,
  quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price     NUMERIC(10,2) NOT NULL,
  total_price    NUMERIC(10,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- reviews
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title      TEXT,
  body       TEXT,
  is_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product  ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user     ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       notification_type NOT NULL DEFAULT 'system',
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read    ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- banners
CREATE TABLE IF NOT EXISTS banners (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  subtitle         TEXT,
  image_url        TEXT NOT NULL,
  mobile_image_url TEXT,
  cta_text         TEXT,
  cta_url          TEXT,
  position         banner_position NOT NULL DEFAULT 'hero',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  display_order    INTEGER NOT NULL DEFAULT 0,
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_active   ON banners(is_active);

-- collections
CREATE TABLE IF NOT EXISTS collections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  cover_image_url TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_products (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);

-- testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_name     TEXT NOT NULL,
  author_image    TEXT,
  author_location TEXT,
  body            TEXT NOT NULL,
  rating          INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- faqs
CREATE TABLE IF NOT EXISTS faqs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  category      TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- email_campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  subject         TEXT NOT NULL,
  html_body       TEXT NOT NULL,
  text_body       TEXT,
  status          campaign_status NOT NULL DEFAULT 'draft',
  target_all      BOOLEAN NOT NULL DEFAULT FALSE,
  target_user_ids UUID[],
  sent_count      INTEGER NOT NULL DEFAULT 0,
  failed_count    INTEGER NOT NULL DEFAULT 0,
  opened_count    INTEGER NOT NULL DEFAULT 0,
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  created_by      UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- analytics_events
CREATE TABLE IF NOT EXISTS analytics_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  page       TEXT,
  device     TEXT,
  browser    TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_type    ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_user    ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);

-- activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  details     JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action  ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  old_values  JSONB,
  new_values  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin  ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- settings
CREATE TABLE IF NOT EXISTS settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT NOT NULL UNIQUE,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update product rating cache
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  target_product_id UUID;
BEGIN
  target_product_id := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE products
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating::NUMERIC), 0)
      FROM reviews
      WHERE product_id = target_product_id AND is_approved = TRUE
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = target_product_id AND is_approved = TRUE
    )
  WHERE id = target_product_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_review_product_rating ON reviews;
CREATE TRIGGER trg_review_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE poster_sizes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners            ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings           ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER so they run as table owner)
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT id FROM user_profiles WHERE uid = auth.uid()::TEXT LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT role::TEXT FROM user_profiles WHERE uid = auth.uid()::TEXT LIMIT 1;
$$;

-- ─── user_profiles ───
DROP POLICY IF EXISTS "own_select"        ON user_profiles;
DROP POLICY IF EXISTS "own_update"        ON user_profiles;
DROP POLICY IF EXISTS "admin_select"      ON user_profiles;
DROP POLICY IF EXISTS "admin_update"      ON user_profiles;
DROP POLICY IF EXISTS "allow_insert"      ON user_profiles;

CREATE POLICY "own_select"   ON user_profiles FOR SELECT USING (uid = auth.uid()::TEXT);
CREATE POLICY "own_update"   ON user_profiles FOR UPDATE USING (uid = auth.uid()::TEXT);
CREATE POLICY "admin_select" ON user_profiles FOR SELECT USING (get_my_role() IN ('admin','super_admin'));
CREATE POLICY "admin_update" ON user_profiles FOR UPDATE USING (get_my_role() IN ('admin','super_admin'));
CREATE POLICY "allow_insert" ON user_profiles FOR INSERT WITH CHECK (TRUE);

-- ─── login_logs ───
DROP POLICY IF EXISTS "own_select"   ON login_logs;
DROP POLICY IF EXISTS "allow_insert" ON login_logs;
DROP POLICY IF EXISTS "admin_select" ON login_logs;

CREATE POLICY "own_select"   ON login_logs FOR SELECT USING (user_id = get_my_profile_id());
CREATE POLICY "allow_insert" ON login_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "admin_select" ON login_logs FOR SELECT USING (get_my_role() IN ('admin','super_admin'));

-- ─── products ───
DROP POLICY IF EXISTS "public_read" ON products;
DROP POLICY IF EXISTS "admin_all"   ON products;

CREATE POLICY "public_read" ON products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "admin_all"   ON products FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── product_categories ───
DROP POLICY IF EXISTS "public_read" ON product_categories;
DROP POLICY IF EXISTS "admin_all"   ON product_categories;

CREATE POLICY "public_read" ON product_categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "admin_all"   ON product_categories FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── poster_sizes ───
DROP POLICY IF EXISTS "public_read" ON poster_sizes;
DROP POLICY IF EXISTS "admin_all"   ON poster_sizes;

CREATE POLICY "public_read" ON poster_sizes FOR SELECT USING (is_active = TRUE);
CREATE POLICY "admin_all"   ON poster_sizes FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── product_images ───
DROP POLICY IF EXISTS "public_read" ON product_images;
DROP POLICY IF EXISTS "admin_all"   ON product_images;

CREATE POLICY "public_read" ON product_images FOR SELECT USING (TRUE);
CREATE POLICY "admin_all"   ON product_images FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── carts ───
DROP POLICY IF EXISTS "own_all" ON carts;
CREATE POLICY "own_all" ON carts FOR ALL USING (user_id = get_my_profile_id());

-- ─── cart_items ───
DROP POLICY IF EXISTS "own_all" ON cart_items;
CREATE POLICY "own_all" ON cart_items FOR ALL
  USING (cart_id IN (SELECT id FROM carts WHERE user_id = get_my_profile_id()));

-- ─── wishlists ───
DROP POLICY IF EXISTS "own_all" ON wishlists;
CREATE POLICY "own_all" ON wishlists FOR ALL USING (user_id = get_my_profile_id());

-- ─── delivery_addresses ───
DROP POLICY IF EXISTS "own_all"      ON delivery_addresses;
DROP POLICY IF EXISTS "admin_select" ON delivery_addresses;

CREATE POLICY "own_all"      ON delivery_addresses FOR ALL USING (user_id = get_my_profile_id());
CREATE POLICY "admin_select" ON delivery_addresses FOR SELECT USING (get_my_role() IN ('admin','super_admin'));

-- ─── orders ───
DROP POLICY IF EXISTS "own_select" ON orders;
DROP POLICY IF EXISTS "own_insert" ON orders;
DROP POLICY IF EXISTS "admin_all"  ON orders;

CREATE POLICY "own_select" ON orders FOR SELECT USING (user_id = get_my_profile_id());
CREATE POLICY "own_insert" ON orders FOR INSERT WITH CHECK (user_id = get_my_profile_id());
CREATE POLICY "admin_all"  ON orders FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── order_items ───
DROP POLICY IF EXISTS "own_select" ON order_items;
DROP POLICY IF EXISTS "own_insert" ON order_items;
DROP POLICY IF EXISTS "admin_all"  ON order_items;

CREATE POLICY "own_select" ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = get_my_profile_id()));
CREATE POLICY "own_insert" ON order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = get_my_profile_id()));
CREATE POLICY "admin_all"  ON order_items FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── reviews ───
DROP POLICY IF EXISTS "public_read" ON reviews;
DROP POLICY IF EXISTS "own_insert"  ON reviews;
DROP POLICY IF EXISTS "own_update"  ON reviews;
DROP POLICY IF EXISTS "admin_all"   ON reviews;

CREATE POLICY "public_read" ON reviews FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "own_insert"  ON reviews FOR INSERT WITH CHECK (user_id = get_my_profile_id());
CREATE POLICY "own_update"  ON reviews FOR UPDATE USING (user_id = get_my_profile_id());
CREATE POLICY "admin_all"   ON reviews FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── notifications ───
DROP POLICY IF EXISTS "own_read"     ON notifications;
DROP POLICY IF EXISTS "own_update"   ON notifications;
DROP POLICY IF EXISTS "allow_insert" ON notifications;
DROP POLICY IF EXISTS "admin_all"    ON notifications;

CREATE POLICY "own_read"     ON notifications FOR SELECT
  USING (user_id = get_my_profile_id() OR user_id IS NULL);
CREATE POLICY "own_update"   ON notifications FOR UPDATE
  USING (user_id = get_my_profile_id());
CREATE POLICY "allow_insert" ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "admin_all"    ON notifications FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── banners ───
DROP POLICY IF EXISTS "public_read" ON banners;
DROP POLICY IF EXISTS "admin_all"   ON banners;

CREATE POLICY "public_read" ON banners FOR SELECT USING (is_active = TRUE);
CREATE POLICY "admin_all"   ON banners FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── collections ───
DROP POLICY IF EXISTS "public_read" ON collections;
DROP POLICY IF EXISTS "admin_all"   ON collections;

CREATE POLICY "public_read" ON collections FOR SELECT USING (is_active = TRUE);
CREATE POLICY "admin_all"   ON collections FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── collection_products ───
DROP POLICY IF EXISTS "public_read" ON collection_products;
DROP POLICY IF EXISTS "admin_all"   ON collection_products;

CREATE POLICY "public_read" ON collection_products FOR SELECT USING (TRUE);
CREATE POLICY "admin_all"   ON collection_products FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── testimonials ───
DROP POLICY IF EXISTS "public_read" ON testimonials;
DROP POLICY IF EXISTS "admin_all"   ON testimonials;

CREATE POLICY "public_read" ON testimonials FOR SELECT USING (is_active = TRUE);
CREATE POLICY "admin_all"   ON testimonials FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── faqs ───
DROP POLICY IF EXISTS "public_read" ON faqs;
DROP POLICY IF EXISTS "admin_all"   ON faqs;

CREATE POLICY "public_read" ON faqs FOR SELECT USING (is_active = TRUE);
CREATE POLICY "admin_all"   ON faqs FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ─── analytics_events ───
DROP POLICY IF EXISTS "allow_insert" ON analytics_events;
DROP POLICY IF EXISTS "admin_select" ON analytics_events;

CREATE POLICY "allow_insert" ON analytics_events FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "admin_select" ON analytics_events FOR SELECT USING (get_my_role() IN ('admin','super_admin'));

-- ─── activity_logs ───
DROP POLICY IF EXISTS "own_select"   ON activity_logs;
DROP POLICY IF EXISTS "allow_insert" ON activity_logs;
DROP POLICY IF EXISTS "admin_select" ON activity_logs;

CREATE POLICY "own_select"   ON activity_logs FOR SELECT USING (user_id = get_my_profile_id());
CREATE POLICY "allow_insert" ON activity_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "admin_select" ON activity_logs FOR SELECT USING (get_my_role() IN ('admin','super_admin'));

-- ─── audit_logs ───
DROP POLICY IF EXISTS "allow_insert" ON audit_logs;
DROP POLICY IF EXISTS "admin_select" ON audit_logs;

CREATE POLICY "allow_insert" ON audit_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "admin_select" ON audit_logs FOR SELECT USING (get_my_role() IN ('admin','super_admin'));

-- ─── settings ───
DROP POLICY IF EXISTS "public_read" ON settings;
DROP POLICY IF EXISTS "admin_all"   ON settings;

CREATE POLICY "public_read" ON settings FOR SELECT USING (TRUE);
CREATE POLICY "admin_all"   ON settings FOR ALL USING (get_my_role() IN ('admin','super_admin'));

-- ============================================================
-- DEFAULT SETTINGS
-- ============================================================
INSERT INTO settings (key, value, description) VALUES
  ('store_name',              '"LUXE Store"',   'Store display name'),
  ('whatsapp_number',         '"919999999999"', 'WhatsApp business number (country code + number, no spaces)'),
  ('delivery_charge',         '60',             'Standard delivery charge in INR'),
  ('free_delivery_threshold', '999',            'Order subtotal above which delivery is free'),
  ('store_email',             '"hello@luxestore.in"', 'Store contact email'),
  ('instagram_url',           '"https://instagram.com/luxestore"', 'Instagram page URL'),
  ('maintenance_mode',        'false',          'Set true to put store in maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Categories
INSERT INTO product_categories (name, slug, product_type, display_order) VALUES
  ('Minimalist',   'minimalist',   'poster',  1),
  ('Abstract',     'abstract',     'poster',  2),
  ('Nature',       'nature',       'poster',  3),
  ('Quotes',       'quotes',       'poster',  4),
  ('Architecture', 'architecture', 'poster',  5),
  ('Fashion',      'fashion-art',  'poster',  6),
  ('Dangle Earrings',    'dangle-earrings',    'earring', 1),
  ('Stud Earrings',      'stud-earrings',      'earring', 2),
  ('Hoop Earrings',      'hoop-earrings',      'earring', 3),
  ('Statement Earrings', 'statement-earrings', 'earring', 4)
ON CONFLICT (slug) DO NOTHING;

-- FAQs
INSERT INTO faqs (question, answer, display_order, is_active) VALUES
  ('What poster sizes do you offer?',
   'We offer A4 (21×29.7 cm), A3 (29.7×42 cm), 12×18 inches, 18×24 inches, and 24×36 inches. Custom sizes are available on request — contact us via WhatsApp.',
   1, TRUE),
  ('How do I place an order?',
   'Add items to your cart, go to checkout, fill in your delivery details, and click "Place Order via WhatsApp". A pre-filled WhatsApp message will open — just send it to confirm your order.',
   2, TRUE),
  ('Do you deliver across India?',
   'Currently we deliver only within Tamil Nadu. We serve all 38 districts. Delivery typically takes 3–5 business days.',
   3, TRUE),
  ('Is delivery free?',
   'Yes! Orders above ₹999 qualify for free delivery. A flat ₹60 charge applies to orders below ₹999.',
   4, TRUE),
  ('What is your return policy?',
   'We accept returns within 7 days of delivery for damaged or defective items. Contact us via WhatsApp with your order number and a photo of the issue.',
   5, TRUE),
  ('What material are the posters printed on?',
   'All posters are printed on premium 250gsm art paper with UV-resistant inks for colours that stay vibrant for decades.',
   6, TRUE),
  ('How do I track my order?',
   'After placing your order via WhatsApp, our team will update you at each stage — confirmed, packed, dispatched, and delivered.',
   7, TRUE),
  ('Do you accept custom designs?',
   'Yes! We accept custom poster designs. Send us your design file via WhatsApp and we will provide a quote within a few hours.',
   8, TRUE)
ON CONFLICT DO NOTHING;

-- Testimonials
INSERT INTO testimonials (author_name, author_location, body, rating, display_order, is_active) VALUES
  ('Priya Krishnamurthy', 'Chennai',
   'The quality of the posters is absolutely stunning. I ordered three A3 prints and they look incredible in my living room. The packaging was also perfect — no creases whatsoever!',
   5, 1, TRUE),
  ('Karthik Subramanian', 'Coimbatore',
   'The earrings I bought as a gift for my wife were exactly as described. She loved them! Delivery was quick and the packaging felt premium. Will definitely order again.',
   5, 2, TRUE),
  ('Meenakshi Rajan', 'Madurai',
   'I was sceptical about ordering online, but LUXE exceeded my expectations. The WhatsApp ordering process is so convenient and the team was very responsive.',
   5, 3, TRUE),
  ('Arjun Venkataraman', 'Salem',
   'Got the minimalist series of posters for my home office. The matte finish is exactly what I wanted. High quality at a fair price.',
   4, 4, TRUE),
  ('Deepika Natarajan', 'Tiruchirappalli',
   'Beautiful earrings, fast delivery, and great customer service. The LUXE team even followed up to check if I was happy with my purchase.',
   5, 5, TRUE),
  ('Ramesh Pillai', 'Tirunelveli',
   'The abstract art posters transformed my bedroom. I have gotten so many compliments from visitors. The packaging was so good I kept the box!',
   5, 6, TRUE)
ON CONFLICT DO NOTHING;

-- Collections
INSERT INTO collections (name, slug, description, display_order, is_active) VALUES
  ('Minimalist Living', 'minimalist-living', 'Clean lines and thoughtful spaces for the modern home.', 1, TRUE),
  ('Bold & Abstract',   'bold-abstract',     'Vibrant statement pieces that demand attention.',         2, TRUE),
  ('Nature''s Palette', 'natures-palette',   'Bring the outdoors in with botanical and landscape prints.', 3, TRUE),
  ('Artisan Gold',      'artisan-gold',      'Handcrafted gold-toned earrings for every occasion.',     4, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Grant service_role full access for server-side API calls
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
