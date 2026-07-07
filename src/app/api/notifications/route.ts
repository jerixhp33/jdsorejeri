import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('id').eq('uid', user.id).single();
  if (!profile) return NextResponse.json({ data: [] });

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .or(`user_id.eq.${profile.id},user_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ data: data || [] });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('id').eq('uid', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const { notificationId, markAll } = body;

  if (markAll) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .or(`user_id.eq.${profile.id},user_id.is.null`)
      .eq('is_read', false);
  } else if (notificationId) {
    await admin.from('notifications').update({ is_read: true }).eq('id', notificationId);
  }

  return NextResponse.json({ success: true });
}
