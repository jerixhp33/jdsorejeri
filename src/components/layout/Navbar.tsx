'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Heart,
  Search,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  CheckCheck,
  Circle,
  Tag,
  Star,
  Info,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useNotifications } from '@/hooks/useNotifications';
import { cn, getInitials, formatRelativeTime } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Notification } from '@/types';
import { JDLogo } from '@/components/shared/JDLogo';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/posters', label: 'Posters' },
  { href: '/earrings', label: 'Earrings' },
  { href: '/collections', label: 'Collections' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const typeIcon: Record<string, React.ElementType> = {
  order:   Package,
  product: Star,
  offer:   Tag,
  system:  Settings,
  admin:   Info,
};

const typeColor: Record<string, string> = {
  order:   'text-blue-400',
  product: 'text-purple-400',
  offer:   'text-yellow-400',
  system:  'text-white/50',
  admin:   'text-red-400',
};

function NotifItem({
  n,
  onRead,
  onClose,
}: {
  n: Notification;
  onRead: (id: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const Icon = typeIcon[n.type] ?? Bell;

  const handleClick = () => {
    if (!n.is_read) onRead(n.id);
    onClose();
    if (n.action_url) router.push(n.action_url);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-all cursor-pointer',
        n.is_read ? 'opacity-50 hover:opacity-80' : 'hover:bg-white/5'
      )}
    >
      <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', typeColor[n.type] ?? 'text-white/40')} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-xs font-medium truncate', n.is_read ? 'text-white/60' : 'text-white')}>
            {n.title}
          </p>
          {!n.is_read && <Circle className="w-1.5 h-1.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
        </div>
        <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">{n.body}</p>
        <p className="text-[10px] text-white/25 mt-1">{formatRelativeTime(n.created_at)}</p>
      </div>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { itemCount } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/');
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const recentNotifs = notifications.slice(0, 5);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled ? 'glass-nav' : 'bg-black/30 backdrop-blur-sm'
        )}
      >
        <div className="page-container">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="JD Store home">
              <JDLogo size={38} />
              <span className="font-display text-xl font-bold tracking-tight text-white group-hover:text-luxe-accent transition-colors">
                JD Store
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    pathname === link.href
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {!loading && user ? (
                <>
                  {/* Notifications Dropdown */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => {
                        setNotifOpen(!notifOpen);
                        setProfileOpen(false);
                      }}
                      className="relative p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
                      aria-label="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-luxe-accent rounded-full text-black text-[10px] font-bold flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {notifOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-80 glass-card overflow-hidden"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                              <Bell className="w-3.5 h-3.5 text-luxe-accent" />
                              <span className="text-sm font-semibold text-white">Notifications</span>
                              {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-luxe-accent text-black text-[10px] font-bold">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1 text-[11px] text-white/40 hover:text-luxe-accent transition-colors"
                              >
                                <CheckCheck className="w-3 h-3" />
                                Mark all read
                              </button>
                            )}
                          </div>

                          {/* Notification list */}
                          <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                            {recentNotifs.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                <Bell className="w-7 h-7 text-white/10 mb-2" />
                                <p className="text-white/30 text-xs">No notifications yet</p>
                              </div>
                            ) : (
                              recentNotifs.map((n) => (
                                <NotifItem
                                  key={n.id}
                                  n={n}
                                  onRead={markAsRead}
                                  onClose={() => setNotifOpen(false)}
                                />
                              ))
                            )}
                          </div>

                          {/* Footer — View all */}
                          <div className="border-t border-white/10">
                            <Link
                              href="/dashboard/notifications"
                              onClick={() => setNotifOpen(false)}
                              className="flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-luxe-accent hover:bg-white/5 transition-all"
                            >
                              View all notifications
                              <ChevronDown className="w-3 h-3 -rotate-90" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Wishlist */}
                  <Link
                    href="/wishlist"
                    className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Wishlist"
                  >
                    <Heart className="w-5 h-5" />
                  </Link>

                  {/* Cart */}
                  <Link
                    href="/cart"
                    className="relative p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Cart"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-luxe-accent rounded-full text-black text-[10px] font-bold flex items-center justify-center">
                        {itemCount > 9 ? '9+' : itemCount}
                      </span>
                    )}
                  </Link>

                  {/* Profile */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setProfileOpen(!profileOpen);
                        setNotifOpen(false);
                      }}
                      className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-all"
                      aria-label="Profile menu"
                    >
                      {profile?.profile_picture ? (
                        <Image
                          src={profile.profile_picture}
                          alt={profile.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-luxe-accent flex items-center justify-center">
                          <span className="text-black text-xs font-bold">
                            {profile ? getInitials(profile.name) : 'U'}
                          </span>
                        </div>
                      )}
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-white/60 transition-transform',
                          profileOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 glass-card overflow-hidden"
                        >
                          <div className="p-3 border-b border-white/10">
                            <p className="text-sm font-medium text-white truncate">
                              {profile?.name}
                            </p>
                            <p className="text-xs text-white/50 truncate">
                              {profile?.email}
                            </p>
                          </div>
                          <div className="p-1">
                            <Link
                              href="/dashboard"
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
                            >
                              <User className="w-4 h-4" />
                              My Profile
                            </Link>
                            <Link
                              href="/dashboard/orders"
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
                            >
                              <Package className="w-4 h-4" />
                              My Orders
                            </Link>
                            <Link
                              href="/dashboard/settings"
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
                            >
                              <Settings className="w-4 h-4" />
                              Settings
                            </Link>
                            {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                              <Link
                                href="/admin"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-luxe-accent hover:bg-white/10 transition-all"
                              >
                                <Settings className="w-4 h-4" />
                                Admin Panel
                              </Link>
                            )}
                            <div className="my-1 border-t border-white/10" />
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : !loading ? (
                <Link href="/login" className="btn-gold !py-2 !px-5 text-sm">
                  Sign In
                </Link>
              ) : null}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden glass-nav border-t border-white/10"
            >
              <div className="page-container py-4 space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'block px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      pathname === link.href
                        ? 'text-white bg-white/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {user && (
                  <div className="pt-2 border-t border-white/10">
                    <Link
                      href="/dashboard/notifications"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Bell className="w-4 h-4" />
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </Link>
                    <Link
                      href="/cart"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Cart {itemCount > 0 && `(${itemCount})`}
                    </Link>
                    <Link
                      href="/wishlist"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Heart className="w-4 h-4" />
                      Wishlist
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4"
            onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative w-full max-w-2xl"
            >
              <form onSubmit={handleSearch} className="glass-card !rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-4">
                  <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posters, earrings, collections..."
                    className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none text-lg"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  {['Wall Posters', 'Gold Earrings', 'A4 Print', 'Minimalist'].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setSearchQuery(term);
                        router.push(`/search?q=${encodeURIComponent(term)}`);
                        setSearchOpen(false);
                      }}
                      className="badge-luxe hover:bg-white/15 transition-all cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for profile dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </>
  );
}