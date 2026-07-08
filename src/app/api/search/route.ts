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
    const words = q.split(/\s+/).filter((w: string) => w.length >= 2);

    let query = supabase
      .from('products')
      .select('slug, name, product_type, price, material, color, tags, images:product_images(url, is_primary)')
      .eq('is_active', true)
      .limit(12);

    if (words.length > 0) {
      const orConditions = words.map((w: string) =>
        `name.ilike.%${w}%,description.ilike.%${w}%,material.ilike.%${w}%,color.ilike.%${w}%`
      ).join(',');
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
