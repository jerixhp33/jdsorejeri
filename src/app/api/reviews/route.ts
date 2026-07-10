import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles').select('id').eq('uid', user.id).single();
    
    if (!profile) return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });

    const body = await request.json();
    const { productId, rating, title, reviewBody } = body;

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid product or rating.' }, { status: 400 });
    }

    // Check if review already exists
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', profile.id)
      .eq('product_id', productId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 400 });
    }

    const { data, error } = await admin.from('reviews').insert({
      user_id: profile.id,
      product_id: productId,
      rating,
      title,
      body: reviewBody,
      is_verified: true,
      is_approved: true, // Auto-approve so it shows immediately
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error inserting review:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}
