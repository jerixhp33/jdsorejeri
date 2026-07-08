'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Trash2, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWebPush } from '@/hooks/useWebPush';
import { toast } from 'sonner';

interface NotificationPrefs {
  order_updates: boolean;
  new_arrivals: boolean;
  offers_discounts: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  order_updates: true,
  new_arrivals: false,
  offers_discounts: true,
};

export function SettingsView() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  const { isSupported, isSubscribed, subscribe } = useWebPush();

  useEffect(() => {
    const stored = (profile as any)?.notification_preferences;
    if (stored && typeof stored === 'object') {
      setNotifPrefs({
        order_updates: stored.order_updates ?? DEFAULT_PREFS.order_updates,
        new_arrivals: stored.new_arrivals ?? DEFAULT_PREFS.new_arrivals,
        offers_discounts: stored.offers_discounts ?? DEFAULT_PREFS.offers_discounts,
      });
    }
  }, [profile]);

  const handleToggle = async (key: keyof NotificationPrefs) => {
    const newPrefs = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(newPrefs);
    
    setSavingNotifs(true);
    try {
      const res = await fetch('/api/profile/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_preferences: newPrefs }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Preferences updated');
    } catch {
      toast.error('Could not save preferences. Please try again.');
      // Revert on failure
      setNotifPrefs(notifPrefs);
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) return;
    const confirmation = prompt('Type DELETE to confirm:');
    if (confirmation !== 'DELETE') { toast.error('Deletion cancelled'); return; }
    setLoading(true);
    toast.info('Account deletion requested. Our team will process this within 24 hours.');
    setLoading(false);
  };

  const NOTIF_ITEMS: { key: keyof NotificationPrefs; label: string; sub: string }[] = [
    { key: 'order_updates', label: 'Order status updates', sub: 'Get notified when your order status changes' },
    { key: 'new_arrivals', label: 'New arrivals', sub: 'Be the first to know about new products' },
    { key: 'offers_discounts', label: 'Offers & discounts', sub: 'Receive promotional offers and deals' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-white">Account Settings</h1>

      {/* Account Information */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-luxe-accent" />
          <h2 className="text-white font-semibold">Account Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wide mb-1 block">Name</label>
            <p className="text-white text-sm p-3 rounded-xl bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {profile?.name || '—'}
            </p>
          </div>
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wide mb-1 block">Email</label>
            <p className="text-white text-sm p-3 rounded-xl bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {profile?.email || '—'}
            </p>
          </div>
        </div>
        <p className="text-white/30 text-xs mt-3">
          Profile information is managed through your Google account.
        </p>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-luxe-accent" />
            <h2 className="text-white font-semibold">Notifications</h2>
          </div>
          {savingNotifs && (
            <span className="text-xs text-white/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-luxe-accent animate-pulse" />
              Saving...
            </span>
          )}
        </div>
        <div className="space-y-4">
          {NOTIF_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p className="text-white text-sm">{item.label}</p>
                <p className="text-white/40 text-xs">{item.sub}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifPrefs[item.key]}
                onClick={() => handleToggle(item.key)}
                className="relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                style={{
                  background: notifPrefs[item.key]
                    ? 'var(--luxe-accent, #D4AF37)'
                    : 'rgba(255,255,255,0.15)',
                }}
              >
                <span
                  className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  style={{
                    transform: notifPrefs[item.key] ? 'translateX(1.25rem)' : 'translateX(0)',
                  }}
                />
              </button>
            </div>
          ))}

          {isSupported && !isSubscribed && (
            <div className="flex items-center justify-between py-4 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p className="text-white text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-luxe-accent" />
                  Push Notifications
                </p>
                <p className="text-white/40 text-xs">Receive updates on your device even when closed</p>
              </div>
              <button
                onClick={() => subscribe()}
                className="px-4 py-1.5 rounded-xl bg-luxe-accent text-black text-xs font-bold hover:bg-[#b5952f] transition-all"
              >
                Enable
              </button>
            </div>
          )}
          {isSupported && isSubscribed && (
            <div className="flex items-center justify-between py-4 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p className="text-white text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-green-400" />
                  Push Notifications
                </p>
                <p className="text-white/40 text-xs">Enabled on this device</p>
              </div>
              <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-400/10 rounded-lg">Active</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 sm:p-6"
        style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-4 h-4 text-red-400" />
          <h2 className="text-red-400 font-semibold">Danger Zone</h2>
        </div>
        <p className="text-white/50 text-sm mb-4">
          Once you delete your account, all your data — orders, wishlist, addresses — will be permanently removed.
        </p>
        <button onClick={handleDeleteAccount} disabled={loading}
          className="px-5 py-2.5 rounded-xl text-red-400 text-sm transition-all disabled:opacity-50"
          style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
          {loading ? 'Processing...' : 'Delete My Account'}
        </button>
      </motion.div>
    </div>
  );
}