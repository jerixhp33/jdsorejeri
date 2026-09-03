import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data, error } = await admin
      .from('faqs')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { data, error } = await admin
      .from('faqs')
      .insert(body)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { id, ...updates } = body;
    const { data, error } = await admin
      .from('faqs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await req.json();
    const { error } = await admin.from('faqs').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}