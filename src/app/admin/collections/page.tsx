export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminCollectionsView } from '@/components/admin/AdminCollectionsView';

export default async function AdminCollectionsPage() {
  const supabase = await createAdminClient();
  const [{ data: collections }, { data: products }] = await Promise.all([
    supabase.from('collections').select('*, products:collection_products(product_id, display_order, product:products(id, name, product_type))').order('display_order'),
    supabase.from('products').select('id, name, product_type, slug').eq('is_active', true).order('name'),
  ]);

  return <AdminCollectionsView collections={collections || []} allProducts={products || []} />;
}
