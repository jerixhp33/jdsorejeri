import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirectTo=/admin');

  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles').select('role').eq('uid', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background flex print:block">
      <AdminSidebar />
      {/* mobile: pt-14 for top bar; desktop: ml-64 for sidebar */}
      <main className="flex-1 pt-14 md:pt-0 md:ml-64 p-4 md:p-8 min-w-0 overflow-x-hidden print:p-0 print:m-0 print:overflow-visible">
        <div className="max-w-7xl mx-auto w-full print:max-w-none">
          {children}
        </div>
      </main>
    </div>
  );
}