import { NextResponse } from 'next/server';
import { getActiveFlashSale } from '@/lib/flash-sales';

export async function GET() {
  try {
    const sale = await getActiveFlashSale();
    if (!sale) return NextResponse.json(null);
    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
