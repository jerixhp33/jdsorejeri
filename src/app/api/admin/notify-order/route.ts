import { NextRequest, NextResponse } from 'next/server';
import { notifyAdmins } from '@/lib/web-push-helper';
import { sendWhatsApp } from '@/lib/whatsapp';
import { formatCurrency } from '@/lib/utils';
import { requireAdmin } from '@/lib/admin-api';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { orderId, orderNumber, total, customerName } = body;

    if (!orderId || !orderNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const formattedTotal = total ? formatCurrency(total) : '';
    const bodyText = `Order ${orderNumber} ${formattedTotal ? `for ${formattedTotal} ` : ''}has been placed${customerName ? ` by ${customerName}` : ''}.`;

    await notifyAdmins({
      title: '🎉 New Order Received!',
      body: bodyText,
      url: `/admin/orders/${orderId}`,
      icon: '/icon-192x192.png'
    });

    // Also send WhatsApp to admin
    await sendWhatsApp('9360490974', `🎉 New Order Received!\n\n${bodyText}\n\nView Order: /admin/orders/${orderId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notify-order endpoint:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
