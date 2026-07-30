-- Add tertiary and quaternary aura glow color columns to home_theme_config
ALTER TABLE public.home_theme_config 
ADD COLUMN IF NOT EXISTS glow_tertiary_color text DEFAULT 'rgba(240, 147, 251, 0.55)',
ADD COLUMN IF NOT EXISTS glow_quaternary_color text DEFAULT 'rgba(0, 255, 135, 0.55)';
