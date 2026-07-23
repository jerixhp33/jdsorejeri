import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendReactEmail } from '@/lib/email';
import AbandonedCartEmail from '@/emails/AbandonedCartEmail';
import * as React from 'react';

export async function GET(request: Request) {
  try {
    // Check cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = await createAdminClient();

    // Find carts that have been pending for more than 1 hour, but less than 24 hours, and haven't been reminded
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: carts, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('status', 'pending')
      .lt('updated_at', oneHourAgo)
      .gt('updated_at', twentyFourHoursAgo);

    if (error) {
      throw error;
    }

    if (!carts || carts.length === 0) {
      return NextResponse.json({ success: true, message: 'No abandoned carts to remind' });
    }

    let sentCount = 0;

    for (const cart of carts) {
      if (!cart.phone) continue;

      // Extract items and name
      let customerName = 'there';
      if (cart.cart_data && typeof cart.cart_data === 'object' && 'name' in cart.cart_data) {
        customerName = (cart.cart_data as any).name || 'there';
      }

      let items: any[] = [];
      if (cart.cart_data && typeof cart.cart_data === 'object' && 'items' in cart.cart_data) {
        items = (cart.cart_data as any).items || [];
      }

      if (items.length === 0) continue;

      // We need their email to send an email. If they don't have an email in cart_data, we can't email them.
      // Wait, abandoned carts only capture phone? Let's check.
      const cartEmail = (cart.cart_data as any).email;
      if (!cartEmail) continue;

      const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?cartId=${cart.id}`;

      const emailComponent = React.createElement(AbandonedCartEmail, {
        customerName,
        items,
        checkoutUrl,
      });

      try {
        await sendReactEmail({
          to: cartEmail,
          subject: 'Did you forget something amazing? 🛒',
          react: emailComponent,
        });

        // Update status to reminded
        await supabase
          .from('abandoned_carts')
          .update({ status: 'reminded' })
          .eq('id', cart.id);

        sentCount++;
      } catch (e) {
        console.error('Failed to send abandoned cart email to', cartEmail, e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sent ${sentCount} abandoned cart emails` 
    });

  } catch (error: any) {
    console.error('Abandoned cart cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
