'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebPush } from '@/hooks/useWebPush';
import { toast } from 'sonner';

export function PushNotificationPrompt() {
  const { isSupported, isSubscribed, subscribe } = useWebPush();
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // We only want to show this in standalone mode (after app install)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!isStandalone) return;

    // Check if notifications are supported and we're not already subscribed
    if (!isSupported || isSubscribed) return;

    // Only prompt if they haven't explicitly denied or granted permission yet
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'default') return;
    }

    // Check if user dismissed it in this session or previously
    const isDismissed = localStorage.getItem('push-prompt-dismissed');
    if (isDismissed) return;

    // Delay the prompt so it doesn't appear immediately on app load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed]);

  const handleSubscribeClick = async () => {
    setIsSubscribing(true);
    try {
      const success = await subscribe();
      if (success) {
        toast.success('Notifications enabled successfully!');
        setIsVisible(false);
      } else {
        // If permission was denied or it failed, just close the prompt
        handleDismiss();
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      handleDismiss();
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    // Use localStorage so it doesn't bother them on next launch either
    localStorage.setItem('push-prompt-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-[380px] z-[9999] p-5 border border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-2xl bg-white/10 backdrop-blur-xl"
      >
        <button 
          onClick={handleDismiss} 
          className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4 items-start pr-6">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-luxe-accent flex-shrink-0">
            <Bell className="w-6 h-6 animate-pulse" />
          </div>
          <div className="text-left">
            <h4 className="text-white text-sm font-semibold tracking-wide">Stay Updated ✦</h4>
            <p className="text-white/70 text-xs mt-1 leading-relaxed">
              Enable notifications to get instant alerts on your order status, new arrivals, and exclusive offers.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 text-white text-xs font-semibold transition-all"
            disabled={isSubscribing}
          >
            Later
          </button>
          <button
            onClick={handleSubscribeClick}
            disabled={isSubscribing}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold transition-all shadow-lg shadow-white/5 flex items-center justify-center disabled:opacity-50"
          >
            {isSubscribing ? 'Enabling...' : 'Enable Now'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
