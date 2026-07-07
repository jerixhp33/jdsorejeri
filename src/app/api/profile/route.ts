import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(null, { status: 401 });
  const admin = await createAdminClient();
  const { data: profile } = await admin.from('user_profiles').select('*').eq('uid', user.id).single();
  return NextResponse.json(profile ?? null);
}
