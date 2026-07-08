import Groq from 'groq-sdk';
import type { SearchIntent } from '@/types/search';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function parseSearchIntent(query: string): Promise<SearchIntent> {
  if (!query) {
    return getFallbackIntent('');
  }

  const systemPrompt = `You are a search intent parser for JD Store, an ecommerce store selling premium items, particularly "posters" and "earrings" (but users might search for anything).
Your job is to parse the user's raw search query and extract structured JSON data.
Return ONLY valid JSON.

JSON Structure:
{
  "productType": "poster" | "earring" | "all",
  "keywords": string[], // All descriptive words (e.g. "minimal", "abstract", "gold")
  "sizes": string[], // Extracted sizes (e.g. "A4", "A3", "12x18")
  "minPrice": number | null,
  "maxPrice": number | null,
  "color": string | null,
  "brand": string | null,
  "gender": string | null,
  "category": string | null,
  "sort": "relevance" | "price_asc" | "price_desc" | "newest"
}

Rules:
1. "productType" must be "poster", "earring", or "all". If they explicitly want posters/art, use "poster". If jewelry/earrings, use "earring".
2. "keywords" should NOT include structural words like "under", "rupees", "cheap", "posters", "earrings", "show", "me".
3. "sizes": Extract specific dimensions.
4. "maxPrice" / "minPrice": Extract numerical limits (e.g. "under 500" -> maxPrice: 500).
5. "color", "brand", "gender", "category" should be extracted if obviously present.
6. "sort": Infer from words like "cheapest" -> "price_asc", "expensive" -> "price_desc", "latest/new" -> "newest". Default is "relevance".
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Query: "${query}"` },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const result = chatCompletion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error("No response from Groq");
    }

    const parsed = JSON.parse(result);
    
    // Ensure all required fields exist
    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      productType: ['poster', 'earring', 'all'].includes(parsed.productType) ? parsed.productType : 'all',
      sizes: Array.isArray(parsed.sizes) ? parsed.sizes : [],
      minPrice: typeof parsed.minPrice === 'number' ? parsed.minPrice : null,
      maxPrice: typeof parsed.maxPrice === 'number' ? parsed.maxPrice : null,
      color: parsed.color || null,
      brand: parsed.brand || null,
      gender: parsed.gender || null,
      category: parsed.category || null,
      sort: ['relevance', 'price_asc', 'price_desc', 'newest'].includes(parsed.sort) ? parsed.sort : 'relevance'
    };
  } catch (error: any) {
    console.error('Error parsing search intent with Groq:', error);
    return getFallbackIntent(query);
  }
}

function getFallbackIntent(query: string): SearchIntent {
  let qText = query.trim().toLowerCase();
  if (qText.endsWith('s') && qText.length > 3) qText = qText.slice(0, -1);
  let words = qText.split(/\s+/).filter(w => w.length > 2);
  let searchType: 'all' | 'poster' | 'earring' = 'all';
  let extractedSizes: string[] = [];
  
  const possibleSizes = ['a4', 'a3', 'a2', 'a1', '12x18'];
  possibleSizes.forEach(s => {
    if (words.includes(s)) {
      extractedSizes.push(s);
      words = words.filter(w => w !== s);
    }
  });

  ['poster', 'earring'].forEach(t => {
    if (words.includes(t)) {
      searchType = t as 'poster' | 'earring';
      words = words.filter(w => w !== t);
    }
  });

  return {
    keywords: words,
    productType: searchType,
    sizes: extractedSizes,
    minPrice: null,
    maxPrice: null,
    color: null,
    brand: null,
    gender: null,
    category: null,
    sort: 'relevance'
  };
}
