import { NextResponse } from 'next/server';
import { parseSearchIntent } from '@/lib/groq';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const parsed = await parseSearchIntent(query);
    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({
      keywords: [],
      productType: 'all',
      error: error.message
    }, { status: 500 });
  }
}
