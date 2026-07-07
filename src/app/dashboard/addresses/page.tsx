export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AddressesView } from '@/components/dashboard/AddressesView';

export default async function AddressesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = await createAdminClient();

  const { data: profile } = await admin
    .from('user_profiles').select('id').eq('uid', user.id).single();
  if (!profile) redirect('/login');

  const { data: addresses } = await admin
    .from('delivery_addresses')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  return <AddressesView addresses={addresses || []} userProfileId={profile.id} />;
}
