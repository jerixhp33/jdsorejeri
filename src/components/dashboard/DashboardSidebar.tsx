'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { User, Package, Heart, MapPin, Settings, LogOut, Bell, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { cn, getInitials } from '@/lib/utils';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Profile', icon: User, exact: true },
  { href: '/dashboard/orders', label: 'Orders', icon: Package },
  { href: '/dashboard/notifications', label: 'Notifs', icon: Bell },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/dashboard/addresses', label: 'Addresses', icon: MapPin },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* ── Mobile: horizontal tab bar ── */}
      <div className="md:hidden">
        {/* Back button */}
        <div className="flex items-center mb-3">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white transition-all active:scale-95 px-2 py-1 -ml-2 rounded-lg hover:bg-white/10">
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
        {/* Profile strip */}
        {profile && (
          <div className="flex items-center gap-3 px-1 py-2 mb-3">
            {profile.profile_picture ? (
              <Image src={profile.profile_picture} alt={profile.name} width={40} height={40} className="rounded-full flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-luxe-accent/20 border border-luxe-accent/30 flex items-center justify-center flex-shrink-0">
                <span className="text-luxe-accent text-sm font-bold">{getInitials(profile.name)}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{profile.name}</p>
              <p className="text-white/40 text-xs truncate">{profile.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-auto flex-shrink-0 p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable tab strip */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-medium transition-all whitespace-nowrap flex-shrink-0 min-w-[56px]',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <div className="relative">
                  <item.icon className="w-4 h-4" />
                  {item.href === '/dashboard/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-luxe-accent rounded-full text-black text-[8px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Desktop: vertical sidebar ── */}
      <div className="hidden md:block md:col-span-1">
        <div className="mb-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-all group">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>
        <div className="glass-card p-5 sticky top-24">
          {/* Avatar & name */}
          <div className="flex flex-col items-center text-center pb-5 border-b border-white/10 mb-5">
            {profile?.profile_picture ? (
              <Image
                src={profile.profile_picture}
                alt={profile.name}
                width={64}
                height={64}
                className="rounded-full mb-3"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-luxe-accent/20 border border-luxe-accent/30 flex items-center justify-center mb-3">
                <span className="text-luxe-accent text-xl font-bold">
                  {profile ? getInitials(profile.name) : 'U'}
                </span>
              </div>
            )}
            <p className="text-white font-semibold text-sm truncate w-full">{profile?.name}</p>
            <p className="text-white/40 text-xs truncate w-full">{profile?.email}</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1">{item.label === 'Notifs' ? 'Notifications' : item.label}</span>
                  {item.href === '/dashboard/notifications' && unreadCount > 0 && (
                    <span className="w-5 h-5 bg-luxe-accent rounded-full text-black text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-2 mt-2 border-t border-white/10">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}