'use client';

import { useState, useEffect } from 'react';
import { 
  Inbox, Bell, CheckCheck, Sparkles, ShoppingBag, CreditCard, 
  Truck, ArrowRight, Eye, Download, Search, Filter, ShieldAlert, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { CustomOrderViewer } from './CustomOrderViewer';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  order_id?: string;
  order_item_id?: string;
  is_read: boolean;
  metadata?: any;
  created_at: string;
  read_at?: string;
}

export function AdminNotificationPanel() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFolder, setActiveFolder] = useState<'all' | 'unread' | 'custom' | 'orders'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (res.ok && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
        if (data.notifications.length > 0 && !selectedId) {
          setSelectedId(data.notifications[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to Supabase Realtime for new notifications
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-notifications-realtime-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((c) => c + 1);
          toast.success(`🔔 New Notification: ${newNotif.title}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectNotification = (notif: NotificationItem) => {
    setSelectedId(notif.id);
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
  };

  // Folder filtering
  const filteredNotifications = notifications.filter((n) => {
    if (activeFolder === 'unread' && n.is_read) return false;
    if (activeFolder === 'custom' && n.type !== 'custom_order') return false;
    if (activeFolder === 'orders' && n.type === 'custom_order') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.metadata?.customer_name && n.metadata.customer_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const selectedNotification = notifications.find((n) => n.id === selectedId);

  return (
    <div className="bg-luxe-gray/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[750px] min-h-[600px]">
      
      {/* Top Header Bar */}
      <div className="px-6 py-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5 text-amber-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Admin Notification Center</h2>
            <p className="text-xs text-white/50">Real-time Inbox for Custom Orders & Store Alerts</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* 3-Column Email Inbox Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        
        {/* Column 1: Folder Sidebar */}
        <div className="col-span-3 border-r border-white/10 bg-black/30 p-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-3 mb-2">Folders</p>
          
          <button
            onClick={() => setActiveFolder('all')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              activeFolder === 'all' ? 'bg-amber-400 text-black font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Inbox className="w-4 h-4" /> All Notifications
            </span>
            <span className="text-[10px] font-mono opacity-80">{notifications.length}</span>
          </button>

          <button
            onClick={() => setActiveFolder('unread')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              activeFolder === 'unread' ? 'bg-amber-400 text-black font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Unread
            </span>
            {unreadCount > 0 && (
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveFolder('custom')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              activeFolder === 'custom' ? 'bg-amber-400 text-black font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Custom Orders
            </span>
            <span className="text-[10px] font-mono opacity-80">
              {notifications.filter((n) => n.type === 'custom_order').length}
            </span>
          </button>

          <button
            onClick={() => setActiveFolder('orders')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              activeFolder === 'orders' ? 'bg-amber-400 text-black font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-400" /> General Orders
            </span>
            <span className="text-[10px] font-mono opacity-80">
              {notifications.filter((n) => n.type !== 'custom_order').length}
            </span>
          </button>
        </div>

        {/* Column 2: Message List */}
        <div className="col-span-4 border-r border-white/10 bg-black/10 overflow-y-auto divide-y divide-white/5">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/40">No notifications found</div>
          ) : (
            filteredNotifications.map((notif) => {
              const isSelected = notif.id === selectedId;
              const isCustom = notif.type === 'custom_order';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleSelectNotification(notif)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white/10 border-l-4 border-amber-400'
                      : notif.is_read
                      ? 'hover:bg-white/5 opacity-75'
                      : 'bg-amber-500/5 hover:bg-amber-500/10 font-semibold'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-xs text-white font-medium truncate">
                      {!notif.is_read && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                      {isCustom ? (
                        <span className="text-purple-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Custom Photo Order
                        </span>
                      ) : (
                        <span>{notif.title}</span>
                      )}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono flex-shrink-0">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-white/80 font-medium truncate">{notif.title}</p>
                  <p className="text-[11px] text-white/50 line-clamp-2 mt-0.5">{notif.message}</p>

                  {notif.metadata?.poster_size && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="bg-amber-400/10 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded text-[10px] font-mono">
                        Size: {notif.metadata.poster_size}
                      </span>
                      {notif.metadata.quality_status && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono capitalize">
                          {notif.metadata.quality_status}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Column 3: Message Detail View Pane */}
        <div className="col-span-5 p-6 overflow-y-auto space-y-6 bg-black/20">
          {selectedNotification ? (
            <div className="space-y-6">
              
              {/* Message Header */}
              <div className="border-b border-white/10 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-400">
                    ID: #{selectedNotification.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-white/50 font-mono">
                    {new Date(selectedNotification.created_at).toLocaleString()}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white">{selectedNotification.title}</h3>
                <p className="text-xs text-white/70 leading-relaxed">{selectedNotification.message}</p>
              </div>

              {/* Order Metadata */}
              {selectedNotification.metadata && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wider">Order Specifications</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-white/40 block">Customer</span>
                      <span className="text-white font-medium">{selectedNotification.metadata.customer_name || 'Manikandan'}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Order Number</span>
                      <span className="text-amber-400 font-mono font-bold">#{selectedNotification.metadata.order_number || 'JD1048'}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Poster Size</span>
                      <span className="text-white font-bold">{selectedNotification.metadata.poster_size || 'A4'}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Frame Option</span>
                      <span className="text-white capitalize">{selectedNotification.metadata.frame || 'Black'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Order Image Viewer Card */}
              {selectedNotification.metadata?.custom_upload_id ? (
                <CustomOrderViewer
                  uploadId={selectedNotification.metadata.custom_upload_id}
                  posterSize={selectedNotification.metadata.poster_size}
                  frameChoice={selectedNotification.metadata.frame}
                  resolution={selectedNotification.metadata.resolution}
                  fileSizeMb={selectedNotification.metadata.file_size_mb}
                  qualityStatus={selectedNotification.metadata.quality_status}
                />
              ) : (
                <div className="pt-4 flex items-center justify-between border-t border-white/10">
                  <a
                    href={`/admin/orders?order=${selectedNotification.order_id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-black font-bold text-xs rounded-lg hover:bg-amber-300 transition-colors"
                  >
                    Open Order Details <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-2">
              <Inbox className="w-10 h-10 opacity-30" />
              <p className="text-xs">Select a notification from the inbox list to view details</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
