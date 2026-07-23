import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { session_id, cart_data, phone_number, customer_name, status } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const admin = await createAdminClient();

    // Use upsert to create or update the cart session
    const { error } = await admin
      .from('abandoned_carts')
      .upsert(
        {
          session_id,
          cart_data,
          phone_number,
          customer_name,
          updated_at: new Date().toISOString(),
          ...(status && { status }), // allow updating status (e.g. 'recovered')
        },
        { onConflict: 'session_id' }
      );

    if (error) {
      console.error('[Abandoned Carts API] Upsert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Abandoned Carts API] Unexpected Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
