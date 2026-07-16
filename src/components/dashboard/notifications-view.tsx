'use client';

import { motion } from 'framer-motion';
import { Bell, Package, Tag, Star, Settings, Info, CheckCheck, Circle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/types';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  order:   { icon: Package,   color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  product: { icon: Star,      color: 'text-purple-400', bg: 'bg-purple-400/10' },
  offer:   { icon: Tag,       color: 'text-luxe-accent', bg: 'bg-luxe-accent/10' },
  system:  { icon: Settings,  color: 'text-foreground/',   bg: 'bg-foreground/' },
  admin:   { icon: Info,      color: 'text-red-400',    bg: 'bg-red-400/10' },
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const router = useRouter();
  const cfg = typeConfig[notification.type] ?? typeConfig.system;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notification.is_read) onRead(notification.id);
    if (notification.action_url) router.push(notification.action_url);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-4 p-4 rounded-xl border transition-all',
        notification.is_read
          ? 'border-foreground/ bg-foreground/ opacity-60 hover:opacity-100'
          : 'border-foreground/ bg-foreground/ cursor-pointer hover:bg-foreground/',
        notification.action_url && 'cursor-pointer'
      )}
    >
      {/* Icon */}
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
        <Icon className={cn('w-4 h-4', cfg.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm md:text-base font-medium leading-snug', notification.is_read ? 'text-foreground/' : 'text-foreground')}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <Circle className="w-2.5 h-2.5 text-luxe-accent fill-luxe-accent flex-shrink-0 mt-1" />
          )}
        </div>
        <p className="text-xs md:text-sm text-foreground/ mt-1 leading-relaxed">{notification.body}</p>
        <p className="text-[11px] md:text-xs text-foreground/ mt-1.5">{formatRelativeTime(notification.created_at)}</p>
      </div>
    </div>
  );
}

export function NotificationsView() {
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-luxe-accent" />
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Notifications</h1>
              <p className="text-foreground/ text-xs mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-xs text-luxe-accent hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-foreground/"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </motion.div>

      {/* List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-3 sm:p-5"
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-foreground/ animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="w-10 h-10 text-foreground/ mb-3" />
            <p className="text-foreground/ text-sm">No notifications yet</p>
            <p className="text-foreground/ text-xs mt-1">We'll notify you about orders and offers</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}