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
    .from('wishlists')
    .select('*, product:products(id, name, slug, price, product_type, images:product_images(url, is_primary))')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('id').eq('uid', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { productId } = await request.json();
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  // Toggle: remove if exists, add if not
  const { data: existing } = await supabase
    .from('wishlists').select('id').eq('user_id', profile.id).eq('product_id', productId).single();

  if (existing) {
    await admin.from('wishlists').delete().eq('id', existing.id);
    return NextResponse.json({ action: 'removed' });
  } else {
    await admin.from('wishlists').insert({ user_id: profile.id, product_id: productId });
    return NextResponse.json({ action: 'added' });
  }
}
