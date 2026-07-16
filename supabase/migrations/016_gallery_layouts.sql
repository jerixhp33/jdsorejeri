-- Create saved_layouts table
CREATE TABLE IF NOT EXISTS public.saved_layouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  room_theme_url text NOT NULL,
  light_source text NOT NULL DEFAULT 'center',
  wall_corners jsonb,
  posters jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.saved_layouts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Saved layouts are viewable by everyone" 
  ON public.saved_layouts FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create a saved layout" 
  ON public.saved_layouts FOR INSERT 
  WITH CHECK (true);

-- Allow authenticated users to update/delete their own
CREATE POLICY "Users can update their own layouts" 
  ON public.saved_layouts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own layouts" 
  ON public.saved_layouts FOR DELETE 
  USING (auth.uid() = user_id);
