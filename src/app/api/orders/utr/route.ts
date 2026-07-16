import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const admin = await createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, utrNumber } = body;

    if (!orderId || !utrNumber) {
      return NextResponse.json({ error: 'Order ID and UTR are required' }, { status: 400 });
    }

    // Verify order belongs to the user
    const { data: profile } = await supabase
      .from('user_profiles').select('id').eq('uid', user.id).single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: order } = await admin.from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (!order || order.user_id !== profile.id) {
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
    }

    // Use admin client to bypass RLS for updating orders
    const { error } = await admin.from('orders').update({
      admin_notes: `PAYMENT METHOD: UPI\nUTR: ${utrNumber}`
    }).eq('id', orderId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to submit UTR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
