import { NextResponse } from 'next/server';
import { parseSearchIntent } from '@/services/search/groq';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const intent = await parseSearchIntent(query);

    return NextResponse.json(intent);
  } catch (error: any) {
    console.error('Error parsing search intent:', error);
    return NextResponse.json(
      { error: 'Failed to parse search intent' },
      { status: 500 }
    );
  }
}
