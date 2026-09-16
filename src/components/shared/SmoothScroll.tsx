'use client';

import { useEffect } from 'react';

export function SmoothScroll({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    // Respect user's motion preferences
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Disable Lenis JS touch interception on mobile devices to restore native 120Hz OS momentum scroll
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    let lenisInstance: any = null;
    let rafId: number;

    import('lenis').then(({ default: Lenis }) => {
      lenisInstance = new Lenis({
        duration: 1.0,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 0,
        syncTouch: false,
        infinite: false,
      });

      if (!isTouchDevice) {
        function raf(time: number) {
          lenisInstance?.raf(time);
          rafId = requestAnimationFrame(raf);
        }
        rafId = requestAnimationFrame(raf);
      }
    }).catch(err => console.error('Failed to initialize Lenis smooth scroll:', err));

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenisInstance) lenisInstance.destroy();
    };
  }, []);

  return <>{children}</>;
}
