export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminBannersView } from '@/components/admin/AdminBannersView';

export default async function AdminBannersPage() {
  const supabase = await createAdminClient();
  const [bannersRes, productsRes, categoriesRes] = await Promise.all([
    supabase.from('banners').select('*').order('display_order'),
    supabase.from('products').select('id, name, slug, product_type').eq('is_active', true),
    supabase.from('product_categories').select('id, name, slug, product_type').eq('is_active', true),
  ]);

  return (
    <AdminBannersView 
      banners={bannersRes.data || []} 
      products={productsRes.data || []}
      categories={categoriesRes.data || []}
    />
  );
}
