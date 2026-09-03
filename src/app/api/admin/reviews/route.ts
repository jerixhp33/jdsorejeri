import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id, is_approved } = await request.json();

    if (!id || typeof is_approved !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { error } = await admin.from('reviews').update({ is_approved }).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = request.nextUrl.searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { error } = await admin.from('reviews').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
