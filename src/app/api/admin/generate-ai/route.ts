import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { requireAdmin } from '@/lib/admin-api';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'mock_key',
});

// Mock data generation helper
const getMockResponse = async (type: string) => {
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
  
  if (type === 'bulk') {
    return NextResponse.json({
      result: JSON.stringify({
        short_description: "A stunning and aesthetic poster to elevate any room's decor.",
        description: "Enhance your living space with this beautiful, premium poster. Carefully crafted with top-tier materials, its rich colors and elegant aesthetic will instantly draw the eye and breathe life into any room. Perfect for modern, contemporary, or minimalist decor.",
        tags: ["Poster", "Wall Art", "Decor", "Aesthetic", "Premium"],
        seo_title: "Premium Aesthetic Poster | JD Store",
        seo_description: "Shop our stunning premium posters to elevate your home decor. Discover high-quality wall art and aesthetic designs at JD Store."
      }),
      isMock: true
    });
  }

  return NextResponse.json({ 
    result: "This is a brilliantly crafted product designed with premium materials. Its aesthetic design makes it a perfect addition to any collection. Designed for longevity and elegance, it stands out effortlessly.",
    isMock: true
  });
};

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
      // Return mock data for testing locally or if key is not configured
      console.log('Using mock AI response (no API key configured)');
      return await getMockResponse(requestType);
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
      ...( (type === 'bulk' || type === 'seo') ? { response_format: { type: 'json_object' } } : {} )
    });

    const result = completion.choices[0]?.message?.content || '';

    // 4. Ideally, log this generation to `ai_generation_logs` table (Phase 2)
    // await supabase.from('ai_generation_logs').insert({ product_id, provider: 'groq', model, tokens: completion.usage?.total_tokens })

    return NextResponse.json({ result });
    
  } catch (error: any) {
    console.error('AI Generation Error. Falling back to mock data:', error.message || error);
    // If Groq fails (e.g. rate limit 429, invalid key), fallback to mock
    return await getMockResponse(requestType);
  }
}
