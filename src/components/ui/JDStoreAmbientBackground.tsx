'use client';

import React, { useEffect, useState } from 'react';

interface Props {
  variant?: 'home' | 'minimal' | 'dark';
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
}

export function JDStoreAmbientBackground({ variant = 'home', intensity = 'medium' }: Props) {
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', motionHandler);

    const timer = setTimeout(() => setMounted(true), 100);

    return () => {
      mediaQuery.removeEventListener('change', motionHandler);
      clearTimeout(timer);
    };
  }, []);

  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 z-0 bg-[#0a0a0a] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#0a0a0a]" />
      </div>
    );
  }

  const opacityMap = {
    low: 0.5,
    medium: 0.9,
    high: 1.3
  };
  const baseOpacity = opacityMap[intensity];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes crossfade1 {
          0%, 100% { opacity: 1; }
          25%, 50%, 75% { opacity: 0; }
        }
        @keyframes crossfade2 {
          0%, 50%, 75%, 100% { opacity: 0; }
          25% { opacity: 1; }
        }
        @keyframes crossfade3 {
          0%, 25%, 75%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        @keyframes crossfade4 {
          0%, 25%, 50%, 100% { opacity: 0; }
          75% { opacity: 1; }
        }

        .ambient-radial-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1000px;
          pointer-events: none;
          will-change: opacity;
        }
      `}} />

      {/* Base Black Background - FIXED so it covers the whole screen */}
      <div className="fixed inset-0 z-0 bg-[#0a0a0a] pointer-events-none" />

      {/* Top Glow - ABSOLUTE so it scrolls away naturally when the user scrolls down */}
      <div 
        className="absolute top-0 left-0 w-full h-[1000px] z-0 pointer-events-none transition-opacity duration-[2500ms] ease-out"
        style={{ opacity: mounted ? baseOpacity : 0 }}
      >
        {/* Layer 1: Lavender */}
        <div 
          className="ambient-radial-glow"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(155, 138, 251, 0.55) 0%, transparent 100%)',
            animation: 'crossfade1 24s ease-in-out infinite'
          }}
        />

        {/* Layer 2: Muted Cyan */}
        <div 
          className="ambient-radial-glow"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(111, 191, 196, 0.55) 0%, transparent 100%)',
            animation: 'crossfade2 24s ease-in-out infinite'
          }}
        />

        {/* Layer 3: Warm Cream / Champagne */}
        <div 
          className="ambient-radial-glow"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(230, 213, 184, 0.55) 0%, transparent 100%)',
            animation: 'crossfade3 24s ease-in-out infinite'
          }}
        />

        {/* Layer 4: Dusty Rose */}
        <div 
          className="ambient-radial-glow"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(197, 143, 165, 0.55) 0%, transparent 100%)',
            animation: 'crossfade4 24s ease-in-out infinite'
          }}
        />
      </div>
    </>
  );
}
