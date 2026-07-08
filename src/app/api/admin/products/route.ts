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

  // Background task to send New Arrivals emails
  (async () => {
    try {
      // Find all users who opted in to new_arrivals
      const { data: users } = await admin
        .from('user_profiles')
        .select('email, name')
        .contains('notification_preferences', { new_arrivals: true });

      if (users && users.length > 0) {
        const { sendEmail } = await import('@/lib/email');
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jdsorejeri.vercel.app';
        
        await Promise.all(users.map(async (u) => {
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #D4AF37; margin-bottom: 5px;">New Arrival at JD Store!</h1>
                <p style="color: #666;">We just added something special.</p>
              </div>
              <p>Hi ${u.name || 'there'},</p>
              <p>We've just published a brand new product that we think you'll love: <strong>${data.name}</strong></p>
              ${data.description ? `<p style="color: #444; line-height: 1.6;">${data.description}</p>` : ''}
              <div style="text-align: center; margin-top: 35px; margin-bottom: 35px;">
                <a href="${siteUrl}/products/${data.slug}" style="background-color: #000; color: #D4AF37; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; border: 1px solid #D4AF37;">
                  Shop New Arrival
                </a>
              </div>
              <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px; margin-bottom: 20px;" />
              <p style="font-size: 11px; color: #999; text-align: center;">
                You are receiving this because you subscribed to New Arrivals notifications.<br/>
                To unsubscribe, log in to your JD Store account and visit Settings > Notifications.
              </p>
            </div>
          `;
          
          await sendEmail({
            to: u.email,
            subject: `✨ Just In: ${data.name} is now available!`,
            html,
          });
        }));
      }
    } catch (err) {
      console.error('Failed to send new arrivals broadcast:', err);
    }
  })();

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { id, key, ...updates } = body;
  const col = id ? 'id' : 'key';
  const val = id ?? key;
  const { data, error } = await admin.from('products').update(updates).eq(col, val).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
  // Delete all collection_products entries for a given product (called before product delete)
  if (body._type === 'collection_products_by_product') {
    const { error } = await admin.from('collection_products').delete().eq('product_id', body.product_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  const { error } = await admin.from('products').delete().eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
