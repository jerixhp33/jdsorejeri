import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { sendWebPushToUser } from '@/lib/web-push-helper';

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { error } = await admin.from('notifications').insert(body);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.user_id) {
    await sendWebPushToUser(body.user_id, {
      title: body.title,
      body: body.body,
      url: body.action_url || '/dashboard/notifications'
    });
  }

  return NextResponse.json({ success: true });
}
