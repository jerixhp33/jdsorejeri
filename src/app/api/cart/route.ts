import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('id').eq('uid', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: cart } = await admin.from('carts').select('*').eq('user_id', profile.id).single();
  if (!cart) return NextResponse.json({ data: { items: [] } });

  const { data: items } = await supabase
    .from('cart_items')
    .select('*, product:products(id, name, slug, images:product_images(url, is_primary)), poster_size:poster_sizes(*)')
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ data: { ...cart, items: items || [] } });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

  const { error } = await admin.from('cart_items').delete().eq('id', itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
