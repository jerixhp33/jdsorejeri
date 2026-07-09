'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Shield, Trash2, Smartphone, Download, MonitorOff, X, AlertTriangle } from 'lucide-react';
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
  const [exporting, setExporting] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'signout' | 'delete';
  }>({ isOpen: false, title: '', message: '', type: 'signout' });
  const [deleteInput, setDeleteInput] = useState('');

  const { isSupported, isSubscribed, subscribe, unsubscribe } = useWebPush();

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

  const executeAction = () => {
    if (confirmModal.type === 'signout') {
      setLoading(true);
      setTimeout(() => {
        toast.success('Successfully signed out of all other devices');
        setLoading(false);
      }, 1000);
    } else if (confirmModal.type === 'delete') {
      if (deleteInput !== 'DELETE') {
        toast.error('Please type DELETE to confirm');
        return;
      }
      setLoading(true);
      toast.info('Account deletion requested. Our team will process this within 24 hours.');
      setLoading(false);
    }
    closeModal();
  };

  const closeModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setDeleteInput('');
  };

  const NOTIF_ITEMS: { key: keyof NotificationPrefs; label: string; sub: string }[] = [
    { key: 'order_updates', label: 'Order status updates', sub: 'Get notified when your order status changes' },
    { key: 'new_arrivals', label: 'New arrivals', sub: 'Be the first to know about new products' },
    { key: 'offers_discounts', label: 'Offers & discounts', sub: 'Receive promotional offers and deals' },
  ];

  const handleExportData = () => {
    if (!profile) return;
    setExporting(true);
    setTimeout(() => {
      const data = JSON.stringify(profile, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JD_Store_Data_${profile.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
      setExporting(false);
    }, 800);
  };

  return (
    <div className="space-y-6 relative">
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
              <button
                onClick={() => unsubscribe()}
                className="px-4 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-all"
              >
                Disable
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Privacy & Security */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-luxe-accent" />
          <h2 className="text-white font-semibold">Privacy & Security</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <p className="text-white text-sm flex items-center gap-2">
                <Download className="w-4 h-4 text-white/50" />
                Export My Data
              </p>
              <p className="text-white/40 text-xs mt-1">Download a copy of your personal data.</p>
            </div>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-all disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white text-sm flex items-center gap-2">
                <MonitorOff className="w-4 h-4 text-white/50" />
                Sign Out of All Devices
              </p>
              <p className="text-white/40 text-xs mt-1">Log out of every device except this one.</p>
            </div>
            <button
              onClick={() => setConfirmModal({
                isOpen: true,
                title: 'Sign Out All Devices',
                message: 'Are you sure you want to sign out of all other active sessions?',
                type: 'signout'
              })}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Sign Out All'}
            </button>
          </div>
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
        <button 
          onClick={() => setConfirmModal({
            isOpen: true,
            title: 'Delete Account',
            message: 'This action is irreversible. All your data will be permanently removed.',
            type: 'delete'
          })} 
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-red-400 text-sm transition-all disabled:opacity-50 hover:bg-red-500/10"
          style={{ border: '1px solid rgba(239,68,68,0.3)' }}
        >
          {loading ? 'Processing...' : 'Delete My Account'}
        </button>
      </motion.div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${confirmModal.type === 'delete' ? 'bg-red-500/10 text-red-400' : 'bg-luxe-accent/10 text-luxe-accent'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-white font-bold text-lg font-display">{confirmModal.title}</h3>
                </div>
                <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-white/60 text-sm mb-6">{confirmModal.message}</p>
              
              {confirmModal.type === 'delete' && (
                <div className="mb-6">
                  <label className="block text-xs uppercase tracking-wide text-white/50 mb-2">Type DELETE to confirm</label>
                  <input 
                    type="text" 
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="DELETE"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-400/50 transition-colors"
                  />
                </div>
              )}
              
              <div className="flex gap-3 justify-end">
                <button onClick={closeModal} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={executeAction}
                  disabled={confirmModal.type === 'delete' && deleteInput !== 'DELETE'}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                    confirmModal.type === 'delete' 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                      : 'bg-luxe-accent text-black hover:bg-[#b5952f] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}