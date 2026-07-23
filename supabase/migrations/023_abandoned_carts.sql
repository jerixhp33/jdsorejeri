CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_data JSONB NOT NULL,
  phone_number TEXT,
  customer_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'recovered', 'ignored')),
  session_id TEXT UNIQUE NOT NULL, -- To uniquely identify a cart session and update it instead of creating duplicates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS setup
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage abandoned carts
CREATE POLICY "Admins can manage abandoned carts"
  ON public.abandoned_carts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Service role bypasses RLS for API insertions
