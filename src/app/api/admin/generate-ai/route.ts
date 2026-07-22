import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { requireAdmin } from '@/lib/admin-api';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'mock_key',
});

export async function POST(req: Request) {
  try {
    // 1. Verify Admin Authentication
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Request
    const { prompt, type, model = 'llama3-70b-8192' } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // If no GROQ_API_KEY is configured, return mock data so development doesn't break
    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY is not set. Returning mock data.");
      
      // Delay to simulate network
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (type === 'seo') {
        return NextResponse.json({ 
          result: JSON.stringify({ 
            title: "Premium Handcrafted Product - JD Store", 
            description: "Shop the finest quality materials and designs. Enjoy free shipping on all orders over ₹999." 
          }),
          isMock: true
        });
      }
      
      if (type === 'tags') {
        return NextResponse.json({ result: "luxury, premium, trending, aesthetic, gift", isMock: true });
      }

      return NextResponse.json({ 
        result: "This is a brilliantly crafted product designed with premium materials. Its aesthetic design makes it a perfect addition to any collection. Designed for longevity and elegance, it stands out effortlessly.",
        isMock: true
      });
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
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
  }
}
