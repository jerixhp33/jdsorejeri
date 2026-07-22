export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminProductsView } from '@/components/admin/AdminProductsView';

export default async function AdminProductsPage() {
  const supabase = await createAdminClient();
  const [productsResponse, categoriesResponse] = await Promise.all([
    supabase.from('products')
      .select('*, category:product_categories(name), images:product_images(url, is_primary), sizes:poster_sizes(id, label, price, stock), cross_sells:product_cross_sells!product_cross_sells_product_id_fkey(cross_sell_product_id)')
      .order('created_at', { ascending: false }),
    supabase.from('product_categories').select('*').order('display_order'),
  ]);

  if (productsResponse.error) {
    console.error("Products fetch error:", productsResponse.error);
  }
  if (categoriesResponse.error) {
    console.error("Categories fetch error:", categoriesResponse.error);
  }

  return <AdminProductsView initialProducts={productsResponse.data || []} categories={categoriesResponse.data || []} />;
}
