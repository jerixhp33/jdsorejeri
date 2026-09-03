import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: notifications, error } = await admin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
