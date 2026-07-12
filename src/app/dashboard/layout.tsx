import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { User, Package, Heart, MapPin, Settings, LogOut, Bell } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Profile', icon: User, exact: true },
  { href: '/dashboard/orders', label: 'My Orders', icon: Package },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/dashboard/addresses', label: 'Addresses', icon: MapPin },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/dashboard');
  }

  return (
    <div className="page-container pt-6 pb-16 md:pb-20 print:p-0 print:m-0 print:max-w-none">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 print:gap-0 print:block">
        <DashboardSidebar />
        <div className="md:col-span-3 print:col-span-1">{children}</div>
      </div>
    </div>
  );
}
