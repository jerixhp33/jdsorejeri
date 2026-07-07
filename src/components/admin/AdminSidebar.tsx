'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { JDLogo } from '@/components/shared/JDLogo';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart3,
  Image as ImageIcon, Layers, Mail, Settings, FileText, LogOut,
  Star, HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/collections', label: 'Collections', icon: Layers },
  { href: '/admin/broadcast', label: 'Broadcast', icon: Mail },
  { href: '/admin/testimonials', label: 'Testimonials', icon: Star },
  { href: '/admin/faqs', label: 'FAQs', icon: HelpCircle },
  { href: '/admin/logs', label: 'Logs', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-luxe-near-black border-r border-white/10 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2.5">
          <JDLogo size={32} />
          <div>
            <p className="text-white font-bold text-sm">JD Admin</p>
            <p className="text-white/40 text-[10px]">Management Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-luxe-accent/15 text-luxe-accent border border-luxe-accent/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all mb-1">
          ← Back to Store
        </Link>
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}