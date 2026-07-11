import { NextRequest, NextResponse } from 'next/server';
import { notifyAdmins } from '@/lib/web-push-helper';
import { formatCurrency } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notify-order endpoint:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
