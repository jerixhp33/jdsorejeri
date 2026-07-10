'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

export function SmoothScroll() {
  useEffect(() => {
    // Disable smooth scroll on mobile for native performance
    if (window.innerWidth < 768) {
      return;
    }

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false,
    });

    // Request Animation Frame loop
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Sync Lenis with scroll restoration / router changes
    const handleScrollToTop = () => {
      lenis.scrollTo(0, { immediate: true });
    };

    // Listen to custom events for modals
    const handlePause = () => lenis.stop();
    const handleResume = () => lenis.start();

    // Listen to route transition completions if possible, or scroll events
    window.addEventListener('popstate', handleScrollToTop);
    window.addEventListener('pause-scroll', handlePause);
    window.addEventListener('resume-scroll', handleResume);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
      window.removeEventListener('popstate', handleScrollToTop);
      window.removeEventListener('pause-scroll', handlePause);
      window.removeEventListener('resume-scroll', handleResume);
    };
  }, []);

  return null;
}
