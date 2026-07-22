export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminProductsView } from '@/components/admin/AdminProductsView';

export default async function AdminProductsPage() {
  const supabase = await createAdminClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products')
      .select('*, category:product_categories(name), images:product_images(url, is_primary), sizes:poster_sizes(id, label, price, stock), cross_sells:product_cross_sells(cross_sell_product_id)')
      .order('created_at', { ascending: false }),
    supabase.from('product_categories').select('*').order('display_order'),
  ]);

  return <AdminProductsView initialProducts={products || []} categories={categories || []} />;
}
