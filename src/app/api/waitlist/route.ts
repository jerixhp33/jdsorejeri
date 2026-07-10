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
    const { productId, posterSizeId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Invalid product.' }, { status: 400 });
    }

    // Insert into waitlist (ignore if already exists due to unique constraint, or handle gracefully)
    const { data, error } = await admin.from('waitlists').insert({
      user_id: profile.id,
      product_id: productId,
      poster_size_id: posterSizeId || null,
    }).select().single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ success: true, message: 'Already on waitlist' });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error joining waitlist:', error);
    return NextResponse.json({ error: error.message || 'Failed to join waitlist' }, { status: 500 });
  }
}
