'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Heart, MapPin, Shield, Monitor, Clock, Bell } from 'lucide-react';
import { formatDate, formatRelativeTime, getInitials } from '@/lib/utils';
import { useWebPush } from '@/hooks/useWebPush';
import type { UserProfile, LoginLog } from '@/types';

interface ProfileViewProps {
  profile: UserProfile;
  loginLogs: LoginLog[];
  orderCount: number;
}

export function ProfileView({ profile, loginLogs, orderCount }: ProfileViewProps) {
  const { isSupported, isSubscribed, subscribe } = useWebPush();

  return (
    <div className="space-y-6">
      {/* Push Notification Promo Card */}
      {isSupported && !isSubscribed && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-luxe-accent/15 to-transparent border border-luxe-accent/20 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-luxe-accent/20 flex items-center justify-center text-luxe-accent flex-shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-left">
              <h3 className="text-white text-sm font-semibold">Enable Push Notifications</h3>
              <p className="text-white/50 text-xs mt-0.5">Stay updated on your orders, packing details, and shipping status in real-time.</p>
            </div>
          </div>
          <button 
            onClick={() => subscribe()}
            className="px-4 py-2 rounded-xl bg-luxe-accent hover:bg-[#b5952f] text-black text-xs font-bold transition-all shadow-lg flex-shrink-0 w-full sm:w-auto"
          >
            Allow Notifications
          </button>
        </motion.div>
      )}

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
          {profile.profile_picture ? (
            <Image src={profile.profile_picture} alt={profile.name} width={80} height={80} className="rounded-2xl" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-luxe-accent/20 border border-luxe-accent/30 flex items-center justify-center">
              <span className="text-luxe-accent text-2xl font-bold">{getInitials(profile.name)}</span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-white mb-1">{profile.name}</h1>
            <p className="text-white/50 text-sm">{profile.email}</p>
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-3">
              <span className="badge-luxe text-xs capitalize">{profile.role}</span>
              <span className="text-white/30 text-xs">Member since {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl font-bold text-white">{orderCount}</p>
            <p className="text-white/40 text-xs mt-1">Orders</p>
          </div>
          <div className="text-center border-x border-white/10">
            <p className="font-display text-xl sm:text-2xl font-bold text-white">{loginLogs.length}</p>
            <p className="text-white/40 text-xs mt-1">Logins</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl font-bold text-luxe-accent">✓</p>
            <p className="text-white/40 text-xs mt-1">Verified</p>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { href: '/dashboard/orders', icon: Package, label: 'My Orders', sub: `${orderCount} total` },
          { href: '/wishlist', icon: Heart, label: 'Wishlist', sub: 'Saved items' },
          { href: '/dashboard/addresses', icon: MapPin, label: 'Addresses', sub: 'Delivery info' },
        ].map((action) => (
          <Link key={action.href} href={action.href} className="glass-card p-4 hover:border-white/25 transition-all group">
            <action.icon className="w-5 h-5 text-luxe-accent mb-3" />
            <p className="text-white text-sm font-medium">{action.label}</p>
            <p className="text-white/40 text-xs mt-0.5">{action.sub}</p>
          </Link>
        ))}
      </motion.div>

      {/* Recent login activity */}
      {loginLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-luxe-accent" />
            <h2 className="text-white font-semibold text-sm">Recent Login Activity</h2>
          </div>
          <div className="space-y-3">
            {loginLogs.map((log, i) => (
              <div key={log.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-white/30" />
                  <div>
                    <p className="text-white/70 text-sm">
                      {log.browser || 'Unknown'} on {log.device || 'Unknown'}
                    </p>
                    {log.ip_address && (
                      <p className="text-white/30 text-xs">{log.ip_address}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-white/30 text-xs">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(log.login_time)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
