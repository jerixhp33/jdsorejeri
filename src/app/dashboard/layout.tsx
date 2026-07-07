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
    <div className="page-container pt-6 pb-16 md:pb-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <DashboardSidebar />
        <div className="md:col-span-3">{children}</div>
      </div>
    </div>
  );
}
