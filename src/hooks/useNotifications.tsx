'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import type { Notification } from '@/types';
import { toast } from 'sonner';
import { Package, BellRing, X } from 'lucide-react';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Single shared client — never recreated on re-render
const supabase = createClient();

export function useNotifications(): NotificationsState {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!profile) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${profile.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications((data as Notification[]) || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!profile) return;

    // Tear down any existing channel first (handles StrictMode double-invoke)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `notifications:${profile.id}:${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          
          // Trigger a beautiful custom toast
          toast.custom((t) => (
            <div className="flex items-start gap-4 p-4 glass-card bg-[#18181b]/95 backdrop-blur-2xl border border-luxe-accent/20 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative overflow-hidden group w-[350px] sm:w-[400px]">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-luxe-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-luxe-accent/20 to-luxe-accent/5 border border-luxe-accent/30 flex items-center justify-center">
                {newNotif.type === 'order' ? (
                  <Package className="w-6 h-6 text-luxe-accent drop-shadow-[0_0_10px_rgba(200,169,110,0.5)]" />
                ) : (
                  <BellRing className="w-6 h-6 text-luxe-accent drop-shadow-[0_0_10px_rgba(200,169,110,0.5)]" />
                )}
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-[#18181b] rounded-full animate-pulse" />
              </div>
              
              <div className="relative flex-1 min-w-0 pt-0.5">
                <p className="text-white font-display font-semibold text-sm mb-1.5 pr-4">{newNotif.title}</p>
                <p className="text-white/60 text-xs leading-relaxed line-clamp-2">{newNotif.body}</p>
                
                {newNotif.action_url && (
                  <button 
                    onClick={() => {
                      toast.dismiss(t);
                      window.location.href = newNotif.action_url!;
                    }}
                    className="mt-3 text-luxe-accent text-xs font-semibold hover:text-white transition-colors flex items-center gap-1"
                  >
                    View Details <span className="text-lg leading-none">→</span>
                  </button>
                )}
              </div>
              
              <button 
                onClick={() => toast.dismiss(t)}
                className="absolute top-3 right-3 text-white/30 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ), { duration: 8000, position: 'top-right' });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!profile) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .or(`user_id.eq.${profile.id},user_id.is.null`)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}