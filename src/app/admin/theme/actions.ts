'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { HomeThemeConfig } from '@/lib/theme';

export async function uploadThemeAsset(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No file provided' };

    const ext = file.name.split('.').pop() || 'bin';
    const filePath = `themes/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('theme-assets')
      .upload(filePath, file, { upsert: true });

    if (error) {
      // Fall back to banners bucket if theme-assets bucket doesn't exist yet
      const { data: fallbackData, error: fallbackError } = await supabase.storage
        .from('banners')
        .upload(filePath, file, { upsert: true });

      if (fallbackError) return { success: false, error: fallbackError.message };
      
      const { data: publicUrlData } = supabase.storage
        .from('banners')
        .getPublicUrl(fallbackData.path);

      return { success: true, url: publicUrlData.publicUrl };
    }

    const { data: publicUrlData } = supabase.storage
      .from('theme-assets')
      .getPublicUrl(data.path);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (e: any) {
    return { success: false, error: e.message || 'Upload failed' };
  }
}

export async function upsertHomeTheme(data: Partial<HomeThemeConfig>) {
  try {
    const supabase = await createClient();

    const payload: any = {
      title: data.title || 'Custom Home Theme',
      is_active: data.is_active ?? true,
      start_at: data.start_at || new Date().toISOString(),
      end_at: data.end_at || new Date(Date.now() + 30 * 86400000).toISOString(),
      glow_primary_color: data.glow_primary_color || 'rgba(0, 242, 254, 0.55)',
      glow_secondary_color: data.glow_secondary_color || 'rgba(240, 147, 251, 0.55)',
      text_accent_color: data.text_accent_color || '#c8a96e',
      element_image_url: data.element_image_url || null,
      element_size: data.element_size || 32,
      element_count: data.element_count || 25,
      element_speed: data.element_speed || 'medium',
      element_direction: data.element_direction || 'fall',
      hero_side_media_url: data.hero_side_media_url || null,
      hero_side_media_type: data.hero_side_media_type || 'image',
      hero_side_link_url: data.hero_side_link_url || null,
      hero_side_title: data.hero_side_title || null,
      updated_at: new Date().toISOString(),
    };

    if (data.id) {
      const { error } = await supabase
        .from('home_theme_config')
        .update(payload)
        .eq('id', data.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from('home_theme_config')
        .insert([payload]);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/admin/theme');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to save theme' };
  }
}

export async function deleteHomeTheme(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('home_theme_config').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    revalidatePath('/');
    revalidatePath('/admin/theme');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to delete theme' };
  }
}
