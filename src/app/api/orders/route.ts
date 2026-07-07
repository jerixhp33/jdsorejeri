import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('user_profiles').select('id').eq('uid', user.id).single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      delivery_address:delivery_addresses(*),
      items:order_items(
        *,
        product:products(id, name, slug, images:product_images(url, is_primary)),
        poster_size:poster_sizes(label)
      )
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: orders || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { data: profile } = await supabase
      .from('user_profiles').select('id').eq('uid', user.id).single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Validate required fields
    const required = ['full_name', 'phone', 'house_no', 'street', 'area', 'city', 'district', 'pincode'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: 'Use checkout page for orders' });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
