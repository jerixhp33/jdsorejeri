import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-api';
import { redirect } from 'next/navigation';
import { AdminCategoriesView } from '@/components/admin/AdminCategoriesView';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .order('created_at', { ascending: false });

  return <AdminCategoriesView initialCategories={categories || []} />;
}
