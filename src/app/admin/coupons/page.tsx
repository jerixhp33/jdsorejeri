export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { AdminCouponsView } from '@/components/admin/AdminCouponsView';

export default async function AdminCouponsPage() {
  const supabase = await createAdminClient();
  const { data: coupons, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error && error.code !== '42P01') console.error('Error fetching coupons:', error);
  return <AdminCouponsView coupons={coupons || []} />;
}
