'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user dismissed it in this session
    const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (isDismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install promotion
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // Clear prompt event
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
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
            <Download className="w-6 h-6 animate-pulse" />
          </div>
          <div className="text-left">
            <h4 className="text-white text-sm font-semibold tracking-wide">Install JD Store App ✦</h4>
            <p className="text-white/70 text-xs mt-1 leading-relaxed">
              Add JD Store to your home screen for buttery smooth 120Hz scrolling, instant order updates, and offline access.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 text-white text-xs font-semibold transition-all"
          >
            Later
          </button>
          <button
            onClick={handleInstallClick}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold transition-all shadow-lg shadow-white/5"
          >
            Install Now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
