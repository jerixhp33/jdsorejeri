import { createPublicClient } from '@/lib/supabase/server';
import type { Product, ProductFilters, PaginatedResponse } from '@/types';

/**
 * Fetch products with filters, sorting, and pagination.
 */
export async function getProducts(
  filters: ProductFilters = {},
  page = 1,
  limit = 12
): Promise<PaginatedResponse<Product>> {
  const supabase = createPublicClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('products')
    .select(
      `
      id, name, slug, price, original_price, product_type, is_active, is_featured, is_trending, is_best_seller, stock, status, short_description, average_rating,
      category:product_categories(id, name, slug),
      images:product_images(id, url, alt_text, is_primary, display_order),
      sizes:poster_sizes(id, label, price, stock, is_active, sku)
    `,
      { count: 'exact' }
    )
    .eq('is_active', true);

  // Apply filters
  if (filters.product_type) {
    query = query.eq('product_type', filters.product_type);
  }

  if (filters.category) {
    query = query.eq('category_id', filters.category);
  }

  if (filters.min_price !== undefined) {
    query = query.gte('price', filters.min_price);
  }

  if (filters.max_price !== undefined) {
    query = query.lte('price', filters.max_price);
  }

  if (filters.material) {
    query = query.ilike('material', `%${filters.material}%`);
  }

  if (filters.color) {
    query = query.ilike('color', `%${filters.color}%`);
  }

  if (filters.is_featured) {
    query = query.eq('is_featured', true);
  }

  if (filters.is_trending) {
    query = query.eq('is_trending', true);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`
    );
  }

  // Apply sorting
  switch (filters.sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'popular':
      query = query.order('review_count', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'rating':
      query = query.order('average_rating', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return { data: [], total: 0, page, limit, has_more: false };
  }

  const total = count ?? 0;

  return {
    data: (data as unknown as Product[]) || [],
    total,
    page,
    limit,
    has_more: offset + limit < total,
  };
}

/**
 * Fetch a single product by slug.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id, name, slug, price, original_price, product_type, is_active, is_featured, is_trending, is_best_seller, stock, status, short_description, average_rating,
      category:product_categories(id, name, slug),
      images:product_images(id, url, alt_text, is_primary, display_order),
      sizes:poster_sizes(id, label, price, stock, is_active, sku)
    `
    )
    .eq('slug', decodeURIComponent(slug))
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data as unknown as Product;
}

/**
 * Fetch a single product by ID.
 */
export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id, name, slug, price, original_price, product_type, is_active, is_featured, is_trending, is_best_seller, stock, status, short_description, average_rating,
      category:product_categories(id, name, slug),
      images:product_images(id, url, alt_text, is_primary, display_order),
      sizes:poster_sizes(id, label, price, stock, is_active, sku)
    `
    )
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }

  return data as unknown as Product;
}

/**
 * Fetch featured products.
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id, name, slug, price, original_price, product_type, is_active, is_featured, is_trending, is_best_seller, stock, status, short_description, average_rating,
      category:product_categories(id, name, slug),
      images:product_images(id, url, alt_text, is_primary, display_order),
      sizes:poster_sizes(id, label, price, stock, is_active, sku)
    `
    )
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as unknown as Product[]) || [];
}

/**
 * Fetch trending products.
 */
export async function getTrendingProducts(limit = 8): Promise<Product[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id, name, slug, price, original_price, product_type, is_active, is_featured, is_trending, is_best_seller, stock, status, short_description, average_rating,
      category:product_categories(id, name, slug),
      images:product_images(id, url, alt_text, is_primary, display_order),
      sizes:poster_sizes(id, label, price, stock, is_active, sku)
    `
    )
    .eq('is_active', true)
    .eq('is_trending', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as unknown as Product[]) || [];
}

/**
 * Fetch best seller products.
 */
export async function getBestSellers(limit = 8): Promise<Product[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id, name, slug, price, original_price, product_type, is_active, is_featured, is_trending, is_best_seller, stock, status, short_description, average_rating,
      category:product_categories(id, name, slug),
      images:product_images(id, url, alt_text, is_primary, display_order),
      sizes:poster_sizes(id, label, price, stock, is_active, sku)
    `
    )
    .eq('is_active', true)
    .eq('is_best_seller', true)
    .order('review_count', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as unknown as Product[]) || [];
}

/**
 * Fetch related products.
 * Strategy:
 *   1. Same category, same type (up to `limit`)
 *   2. If fewer than `limit` returned, fill remaining slots with
 *      same product type from any other category (excluding already-found ids)
 * This prevents empty or single-result sections when a category has few products.
 */
export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
  productType?: string
): Promise<Product[]> {
  const supabase = createPublicClient();

  const FIELDS = `
    id, name, slug, price, original_price, product_type, is_active, is_featured, is_trending, is_best_seller, stock, status, short_description, average_rating,
    category:product_categories(id, name, slug),
    images:product_images(id, url, alt_text, is_primary, display_order),
    sizes:poster_sizes(id, label, price, stock, is_active, sku)
  `;

  // ── Stage 1: same category ──────────────────────────────────────
  let stage1 = supabase
    .from('products')
    .select(FIELDS)
    .eq('is_active', true)
    .eq('category_id', categoryId)
    .neq('id', productId);

  if (productType) stage1 = stage1.eq('product_type', productType);

  const { data: sameCat } = await stage1.limit(limit);
  const results: Product[] = (sameCat as unknown as Product[]) || [];

  // ── Stage 2: fill remaining with same type, any category ─────────
  if (results.length < limit) {
    const needed = limit - results.length;
    const excludeIds = [productId, ...results.map((p) => p.id)];

    let stage2 = supabase
      .from('products')
      .select(FIELDS)
      .eq('is_active', true)
      .neq('category_id', categoryId)   // avoid duplicates from stage 1
      .not('id', 'in', `(${excludeIds.join(',')})`);

    if (productType) stage2 = stage2.eq('product_type', productType);

    // Prefer trending / best sellers as fillers
    stage2 = stage2.order('is_trending', { ascending: false });

    const { data: otherCat } = await stage2.limit(needed);
    results.push(...((otherCat as unknown as Product[]) || []));
  }

  return results;
}

/**
 * Search products by query.
 */
export async function searchProducts(query: string, limit = 10): Promise<Product[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:product_categories(*),
      images:product_images(*)
    `
    )
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit);

  if (error) return [];
  return (data as unknown as Product[]) || [];
}

/**
 * Fetch cross-sell products for a given product.
 */
export async function getCrossSells(productId: string): Promise<Product[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('product_cross_sells')
    .select(`
      cross_sell_product:products!product_cross_sells_cross_sell_product_id_fkey(
        id, name, slug, price, original_price, product_type, is_active, is_featured, is_trending, is_best_seller, stock, status, short_description, average_rating,
        category:product_categories(id, name, slug),
        images:product_images(id, url, alt_text, is_primary, display_order),
        sizes:poster_sizes(id, label, price, stock, is_active, sku)
      )
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getCrossSells] Supabase error:', error.message, error.code);
    return [];
  }
  if (!data) return [];
  
  return data
    .map((item: any) => item.cross_sell_product)
    .filter((p: any) => p && p.is_active);
}
