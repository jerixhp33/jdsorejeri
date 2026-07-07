'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JDLogo } from '@/components/shared/JDLogo';

export function PageLoader() {
  // Only show on first visit per session — not on client-side navigations
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if we've already shown the loader this session
    const hasLoaded = sessionStorage.getItem('jd-loaded');
    if (hasLoaded) {
      setVisible(false);
      return;
    }
    // First visit — show loader
    sessionStorage.setItem('jd-loaded', '1');
    setVisible(true);

    // Animate progress bar
    const t1 = setTimeout(() => setProgress(40), 100);
    const t2 = setTimeout(() => setProgress(70), 500);
    const t3 = setTimeout(() => setProgress(90), 900);
    const t4 = setTimeout(() => setProgress(100), 1300);
    // Dismiss after progress completes
    const t5 = setTimeout(() => setVisible(false), 1700);

    return () => { [t1,t2,t3,t4,t5].forEach(clearTimeout); };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden"
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(200,169,110,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,0.5) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />

          {/* Radial fade over grid — wide enough to kill edges on mobile */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 75% at 50% 50%, transparent 15%, #0a0a0a 65%)',
            }}
          />

          {/* Soft ambient glow — tiny opacity so it doesn't flood */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Logo with pulse ring */}
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring */}
              <motion.div
                className="absolute rounded-full border border-luxe-accent/20"
                animate={{ scale: [1, 1.6, 2], opacity: [0.6, 0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                style={{ width: 80, height: 80 }}
              />
              <motion.div
                className="absolute rounded-full border border-luxe-accent/15"
                animate={{ scale: [1, 1.8, 2.4], opacity: [0.4, 0.15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                style={{ width: 80, height: 80 }}
              />

              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <JDLogo size={56} />
              </motion.div>
            </div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <p className="font-display text-2xl font-bold tracking-widest text-white">
                JD Store
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/30 text-[11px] tracking-[0.3em] uppercase mt-1"
              >
                Premium · Curated · Delivered
              </motion.p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4 }}
              className="w-48 h-px bg-white/10 rounded-full overflow-hidden relative"
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #c8a96e, #e8d5a3, #c8a96e)',
                  backgroundSize: '200% 100%',
                }}
                animate={{
                  width: `${progress}%`,
                  backgroundPosition: ['0% 0%', '100% 0%'],
                }}
                transition={{
                  width: { duration: 0.4, ease: 'easeOut' },
                  backgroundPosition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
                }}
              />
            </motion.div>
          </div>

          {/* Bottom tag */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-8 text-white/40 text-[10px] tracking-[0.25em] uppercase"
          >
            Art for every space
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}