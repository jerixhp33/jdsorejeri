-- Create waitlists table to allow users to sign up for out of stock alerts
CREATE TABLE IF NOT EXISTS waitlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  poster_size_id UUID REFERENCES poster_sizes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, poster_size_id)
);

-- Enable RLS
ALTER TABLE waitlists ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist entries
CREATE POLICY "Users can view their own waitlist entries"
  ON waitlists FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE uid = auth.uid()::text
    )
  );

-- Users can insert their own waitlist entries
CREATE POLICY "Users can insert their own waitlist entries"
  ON waitlists FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE uid = auth.uid()::text
    )
  );

-- Users can delete their own waitlist entries
CREATE POLICY "Users can delete their own waitlist entries"
  ON waitlists FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE uid = auth.uid()::text
    )
  );

-- Admins have full access
CREATE POLICY "Admins have full access to waitlists"
  ON waitlists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE uid = auth.uid() AND role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlists_user_product ON waitlists(user_id, product_id);
