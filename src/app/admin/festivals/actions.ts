'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function upsertFestival(data: any) {
  const supabase = await createClient();
  
  // Enforce overlap protection
  if (data.is_active) {
    const { data: overlapping, error: overlapError } = await supabase
      .from('festivals')
      .select('id, name')
      .neq('id', data.id || '00000000-0000-0000-0000-000000000000') // Exclude current if editing
      .eq('is_active', true)
      .lte('start_at', data.end_at)
      .gt('end_at', data.start_at);
      
    if (overlapError) {
      return { success: false, error: 'Failed to check for overlapping festivals' };
    }
    
    if (overlapping && overlapping.length > 0) {
      return { 
        success: false, 
        error: `Cannot activate. Schedule overlaps with existing active festival: ${overlapping[0].name}` 
      };
    }
  }

  const payload = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  if (data.id) {
    // Update
    const { error } = await supabase
      .from('festivals')
      .update(payload)
      .eq('id', data.id);
    
    if (error) return { success: false, error: error.message };
  } else {
    // Insert
    const { error } = await supabase
      .from('festivals')
      .insert([payload]);
      
    if (error) return { success: false, error: error.message };
  }

  revalidatePath('/admin/festivals');
  revalidatePath('/'); // Revalidate main page where theme is applied
  return { success: true };
}

export async function deleteFestival(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('festivals')
    .delete()
    .eq('id', id);
    
  if (error) return { success: false, error: error.message };
  
  revalidatePath('/admin/festivals');
  revalidatePath('/');
  return { success: true };
}
