import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendReactEmail } from '@/lib/email';
import AbandonedCartEmail from '@/emails/AbandonedCartEmail';
import * as React from 'react';

export async function GET(req: NextRequest) {
  // Verify Cron Secret if set
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();

  try {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Fetch carts that haven't been modified in 2 hours
    const { data: carts, error: cartsErr } = await supabase
      .from('carts')
      .select(`
        id, 
        user_id, 
        updated_at,
        user:user_profiles!inner(email, name),
        items:cart_items(count)
      `)
      .lt('updated_at', twoHoursAgo.toISOString());

    if (cartsErr) throw cartsErr;
    if (!carts || carts.length === 0) {
      return NextResponse.json({ message: 'No abandoned carts found.' });
    }

    let processedCount = 0;

    for (const cart of carts) {
      // Only process carts with items
      if (cart.items?.[0]?.count === 0) continue;

      // Check if user has already ordered after this cart was last updated
      const { data: recentOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', cart.user_id)
        .gt('created_at', cart.updated_at)
        .limit(1)
        .maybeSingle();

      if (recentOrder) {
        continue; // User has placed an order, cart is not abandoned
      }

      // Check existing reminders for this cart
      const { data: existingReminders } = await supabase
        .from('abandoned_cart_reminders')
        .select('sequence_number')
        .eq('cart_id', cart.id);

      const sentSequences = existingReminders?.map((r: any) => r.sequence_number) || [];
      const lastUpdatedAt = new Date(cart.updated_at);

      let targetSequence = 0;
      if (lastUpdatedAt <= fortyEightHoursAgo && !sentSequences.includes(3)) targetSequence = 3;
      else if (lastUpdatedAt <= twentyFourHoursAgo && !sentSequences.includes(2)) targetSequence = 2;
      else if (lastUpdatedAt <= twoHoursAgo && !sentSequences.includes(1)) targetSequence = 1;

      if (targetSequence > 0) {
        const cartEmail = (cart.user as any).email;
        const customerName = (cart.user as any).name || 'there';
        const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`;
        
        // Attempt to insert reminder to claim lock
        const { error: insertErr } = await supabase
          .from('abandoned_cart_reminders')
          .insert({
            cart_id: cart.id,
            user_id: cart.user_id,
            email: cartEmail,
            sequence_number: targetSequence,
            status: 'sent'
          });

        // If insert succeeds (no unique constraint violation), send email
        if (!insertErr) {
          const emailComponent = React.createElement(AbandonedCartEmail, {
            customerName,
            items: [], // we aren't fetching full item data for now to simplify
            checkoutUrl,
          });

          await sendReactEmail({
            to: cartEmail,
            subject: targetSequence === 3 ? 'Final Reminder: Your JD Store Cart' : 'You left something behind!',
            react: emailComponent,
          });
          processedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
