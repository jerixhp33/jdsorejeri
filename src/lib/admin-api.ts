import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles').select('role').eq('uid', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return null;
  return admin;
}
