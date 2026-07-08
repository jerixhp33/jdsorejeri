import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const supabase = await createAdminClient();
    // Strip trailing 's' from words to handle basic plurals (e.g. posters -> poster)
    const words = q.split(/\s+/)
      .map((w: string) => w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w)
      .filter((w: string) => w.length >= 2);

    let query = supabase
      .from('products')
      .select('slug, name, product_type, price, material, color, tags, images:product_images(url, is_primary)')
      .eq('is_active', true)
      .limit(12);

    if (words.length > 0) {
      const orConditions = words.map((w: string) => {
        let condition = `name.ilike.%${w}%,description.ilike.%${w}%,material.ilike.%${w}%,color.ilike.%${w}%,tags.cs.{${w}}`;
        // Exact match for enums if the search word happens to be the enum value
        if (w === 'poster' || w === 'earring') {
          condition += `,product_type.eq.${w}`;
        }
        return condition;
      }).join(',');
      query = query.or(orConditions);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Score and sort by relevance
    const scored = (data || []).map((item: any) => {
      let score = 0;
      const nameLower = (item.name || '').toLowerCase();
      const typeLower = (item.product_type || '').toLowerCase();
      words.forEach((w: string) => {
        if (nameLower.includes(w)) score += 10;
        if (typeLower.includes(w)) score += 5;
        if (item.tags?.some((t: string) => t.toLowerCase().includes(w))) score += 3;
        if ((item.material || '').toLowerCase().includes(w)) score += 3;
        if ((item.color || '').toLowerCase().includes(w)) score += 3;
      });
      return { ...item, _score: score };
    });
    scored.sort((a: any, b: any) => b._score - a._score);

    return NextResponse.json(scored);
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
