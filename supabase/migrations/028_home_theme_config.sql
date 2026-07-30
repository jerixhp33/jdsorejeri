-- Create home_theme_config table
CREATE TABLE IF NOT EXISTS public.home_theme_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  is_active boolean DEFAULT true,
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  
  -- Visual Glow & Text Accent
  glow_primary_color text DEFAULT 'rgba(0, 242, 254, 0.55)',
  glow_secondary_color text DEFAULT 'rgba(240, 147, 251, 0.55)',
  text_accent_color text DEFAULT '#c8a96e',
  
  -- Falling Custom PNG Elements
  element_image_url text,
  element_size integer DEFAULT 32,
  element_count integer DEFAULT 25,
  element_speed text DEFAULT 'medium',
  element_direction text DEFAULT 'fall',
  
  -- Hero Right-side Media Slot
  hero_side_media_url text,
  hero_side_media_type text DEFAULT 'image',
  hero_side_link_url text,
  hero_side_title text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_theme_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access on home_theme_config"
  ON public.home_theme_config FOR SELECT
  USING (true);

CREATE POLICY "Allow admin full access on home_theme_config"
  ON public.home_theme_config
  USING (
    get_my_role() IN ('admin', 'super_admin')
  );

-- Grants
GRANT SELECT ON public.home_theme_config TO anon, authenticated;
GRANT ALL ON public.home_theme_config TO authenticated;
