import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await admin.from('products').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  // Handle collection_products insert
  if (body._type === 'collection_products') {
    const { error } = await admin.from('collection_products').insert(body.items);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  // Handle order notification
  if (body._notify) {
    await admin.from('notifications').insert({ user_id: body.user_id, title: `Order #${body.order_number} Update`, body: body.message, type: 'order', action_url: '/dashboard/orders' });
    return NextResponse.json({ success: true });
  }
  const { data, error } = await admin.from('products').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send New Arrivals emails
  try {
    // Find all users who opted in to new_arrivals
    const { data: users } = await admin
      .from('user_profiles')
      .select('email, name')
      .contains('notification_preferences', { new_arrivals: true });

    if (users && users.length > 0) {
      if (body.notify_users) {
        const { sendReactEmail } = await import('@/lib/email');
        const NewArrivalEmail = (await import('@/emails/NewArrivalEmail')).default;
        const React = await import('react');
        
        // Force the live site URL for emails so it never links to localhost, even when testing locally
        const siteUrl = 'https://jdstorejeri.vercel.app';
        
        await Promise.all(users.map(async (u) => {
          const emailComponent = React.createElement(NewArrivalEmail, {
            customerName: u.name || 'there',
            productName: data.name,
            productUrl: `${siteUrl}/product/${data.slug}`
          });

          await sendReactEmail({
            to: u.email,
            subject: `New Arrival: ${data.name}`,
            react: emailComponent
          }).catch(err => {
            console.error(`Failed to send new arrival email to ${u.email}:`, err);
          });
        }));
      }
    }
  } catch (err) {
    console.error('Failed to send new arrivals broadcast:', err);
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { id, key, notify_users, ...updates } = body;
  const col = id ? 'id' : 'key';
  const val = id ?? key;
  const { data, error } = await admin.from('products').update(updates).eq(col, val).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send New Arrivals emails if published
  if (notify_users) {
    try {
      const { data: users } = await admin
        .from('user_profiles')
        .select('email, name')
        .contains('notification_preferences', { new_arrivals: true });

      if (users && users.length > 0) {
        const { sendReactEmail } = await import('@/lib/email');
        const NewArrivalEmail = (await import('@/emails/NewArrivalEmail')).default;
        const React = await import('react');
        
        const siteUrl = 'https://jdstorejeri.vercel.app';
        
        await Promise.all(users.map(async (u) => {
          const emailComponent = React.createElement(NewArrivalEmail, {
            customerName: u.name || 'there',
            productName: data.name,
            productUrl: `${siteUrl}/product/${data.slug}`
          });

          await sendReactEmail({
            to: u.email,
            subject: `New Arrival: ${data.name}`,
            react: emailComponent
          }).catch(err => {
            console.error(`Failed to send new arrival email to ${u.email}:`, err);
          });
        }));
      }
    } catch (err) {
      console.error('Failed to send new arrivals broadcast:', err);
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();

  // Delete all collection_products entries for a given collection
  if (body._type === 'products') {
    const { error } = await admin.from('collection_products').delete().eq('collection_id', body.collection_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const clearProductDependencies = async (productIds: string[]) => {
    await admin.from('product_images').delete().in('product_id', productIds);
    await admin.from('poster_sizes').delete().in('product_id', productIds);
    await admin.from('order_items').delete().in('product_id', productIds);
    await admin.from('collection_products').delete().in('product_id', productIds);
    await admin.from('product_cross_sells').delete().in('product_id', productIds);
    await admin.from('product_cross_sells').delete().in('cross_sell_product_id', productIds);
    await admin.from('cart_items').delete().in('product_id', productIds);
    await admin.from('wishlists').delete().in('product_id', productIds);
    await admin.from('waitlists').delete().in('product_id', productIds);
  };

  // Handle bulk delete
  if (body._type === 'bulk_delete' && Array.isArray(body.ids)) {
    try {
      await clearProductDependencies(body.ids);
      const { error } = await admin.from('products').delete().in('id', body.ids);
      if (error) throw error;
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Handle single delete
  if (body.id) {
    try {
      await clearProductDependencies([body.id]);
      const { error } = await admin.from('products').delete().eq('id', body.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Fallback for legacy calls
  if (body._type === 'collection_products_by_product') {
    const { error } = await admin.from('collection_products').delete().eq('product_id', body.product_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
