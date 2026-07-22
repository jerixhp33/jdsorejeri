import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { requireAdmin } from '@/lib/admin-api';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'mock_key',
});

export async function POST(req: Request) {
  let requestType = '';
  try {
    // 1. Verify Admin Authentication
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Request
    const { prompt, type, model = 'llama3-70b-8192' } = await req.json();
    requestType = type;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured in Vercel' }, { status: 500 });
    }

    // 3. Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: model,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const result = completion.choices[0]?.message?.content || '';

    // 4. Ideally, log this generation to `ai_generation_logs` table (Phase 2)
    // await supabase.from('ai_generation_logs').insert({ product_id, provider: 'groq', model, tokens: completion.usage?.total_tokens })

    return NextResponse.json({ result });
    
  } catch (error: any) {
    console.error('AI Generation Error:', error.message || error);
    return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
  }
}
