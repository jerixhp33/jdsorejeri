import { createPublicClient } from '@/lib/supabase/server';

export interface HomeThemeConfig {
  id?: string;
  title: string;
  is_active: boolean;
  start_at: string;
  end_at: string;
  glow_primary_color?: string;
  glow_secondary_color?: string;
  text_accent_color?: string;
  element_image_url?: string;
  element_size?: number;
  element_count?: number;
  element_speed?: 'slow' | 'medium' | 'fast';
  element_direction?: 'fall' | 'float';
  home_bg_media_url?: string;
  home_bg_media_type?: 'image' | 'video';
  home_bg_opacity?: number;
}

export async function getActiveHomeTheme(): Promise<HomeThemeConfig | null> {
  try {
    const supabase = createPublicClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('home_theme_config')
      .select('*')
      .eq('is_active', true)
      .lte('start_at', now)
      .gt('end_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as HomeThemeConfig;
  } catch (e) {
    console.error('Error fetching home theme:', e);
    return null;
  }
}
