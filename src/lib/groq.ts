import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function parseSearchIntent(query: string) {
  if (!query) {
    return { keywords: [], productType: 'all', minPrice: null, maxPrice: null };
  }

  const systemPrompt = `You are a search intent parser for an ecommerce store that sells "posters" and "earrings".
Your job is to parse the user's raw search query and extract structured data.
Return ONLY valid JSON with no markdown formatting or extra text.
The JSON must have the following structure:
{
  "productType": "poster" | "earring" | "all",
  "keywords": string[],
  "sizes": string[],
  "minPrice": number | null,
  "maxPrice": number | null
}

Rules:
1. If the user explicitly mentions posters, set productType to "poster". If earrings, set to "earring". Otherwise "all".
2. Extract all descriptive keywords (e.g. "minimal", "abstract", "bold", "gold") into the keywords array. Do NOT include words like "under", "rupees", "cheap", "posters", or "earrings".
3. Extract any specific sizes mentioned (e.g., "A4", "A3", "12x18") into the sizes array.
4. If they specify a maximum price (e.g., "under 500"), set maxPrice to 500.
5. If they specify a minimum price, set minPrice.
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Query: "${query}"` },
      ],
      model: 'llama3-8b-8192',
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const result = chatCompletion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error("No response from Groq");
    }

    return JSON.parse(result);
  } catch (error: any) {
    console.error('Error parsing search intent:', error);
    // Fallback parser if Groq fails or rate limits
    let qText = query.trim().toLowerCase();
    if (qText.endsWith('s') && qText.length > 3) qText = qText.slice(0, -1);
    let words = qText.split(/\s+/).filter(w => w.length > 2);
    let searchType = 'all';
    let extractedSizes: string[] = [];
    
    // Fallback size extraction
    const possibleSizes = ['a4', 'a3', 'a2', 'a1', '12x18'];
    possibleSizes.forEach(s => {
      if (words.includes(s)) {
        extractedSizes.push(s);
        words = words.filter(w => w !== s);
      }
    });

    ['poster', 'earring'].forEach(t => {
      if (words.includes(t)) {
        searchType = t;
        words = words.filter(w => w !== t);
      }
    });

    return {
      keywords: words,
      productType: searchType,
      sizes: extractedSizes,
      minPrice: null,
      maxPrice: null
    };
  }
}
