-- Create enum for festival theme types
CREATE TYPE festival_theme_type AS ENUM ('diwali', 'christmas', 'pongal', 'valentines', 'halloween', 'newyear');

-- Create festivals table
CREATE TABLE IF NOT EXISTS public.festivals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  theme_type festival_theme_type NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access on festivals"
  ON public.festivals FOR SELECT
  USING (true);

-- Allow authenticated users with role 'admin' to manage festivals
CREATE POLICY "Allow admin full access on festivals"
  ON public.festivals
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON public.festivals TO anon, authenticated;
GRANT ALL ON public.festivals TO authenticated;

-- Insert a mock active festival (Diwali starting now and ending in 30 days) for testing
INSERT INTO public.festivals (name, theme_type, start_at, end_at, is_active)
VALUES (
  'Diwali Dhamaka', 
  'diwali', 
  now() - interval '1 day', 
  now() + interval '30 days', 
  true
);
