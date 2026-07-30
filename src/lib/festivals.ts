import { createPublicClient } from './supabase/server';
import type { Festival } from '@/types';

/**
 * Fetch the currently active festival.
 * Active condition: is_active = true AND start_at <= current_time AND current_time < end_at.
 * 
 * If multiple overlap, it picks the most recently created one.
 * (Note: Overlap protection should be enforced at creation time in admin panel).
 */
export async function getActiveFestival(): Promise<Festival | null> {
  const supabase = createPublicClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('festivals')
    .select('*')
    .eq('is_active', true)
    .lte('start_at', now)
    .gt('end_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Festival;
}
