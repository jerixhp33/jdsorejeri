'use client';

import React, { useEffect, useState } from 'react';
import { useFestival } from '@/components/providers/FestivalProvider';

interface Props {
  variant?: 'home' | 'minimal' | 'dark';
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
}

export function JDStoreAmbientBackground({ variant = 'home', intensity = 'medium' }: Props) {
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { activeFestival, optOut } = useFestival();

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

  const showFestival = activeFestival && !optOut;
  const themeType = activeFestival?.theme_type;

  // Render the default JD Store ambient aura glow
  const renderDefaultAmbient = () => (
    <>
      {/* Layer 1: Vibrant Teal */}
      <div 
        className="ambient-radial-glow"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(0, 242, 254, 0.55) 0%, transparent 100%)',
          animation: 'crossfade1 24s ease-in-out infinite'
        }}
      />
      {/* Layer 2: Deep Sky Blue */}
      <div 
        className="ambient-radial-glow"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(79, 172, 254, 0.55) 0%, transparent 100%)',
          animation: 'crossfade2 24s ease-in-out infinite'
        }}
      />
      {/* Layer 3: Neon Purple / Pink */}
      <div 
        className="ambient-radial-glow"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(240, 147, 251, 0.55) 0%, transparent 100%)',
          animation: 'crossfade3 24s ease-in-out infinite'
        }}
      />
      {/* Layer 4: Electric Mint */}
      <div 
        className="ambient-radial-glow"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(0, 255, 135, 0.55) 0%, transparent 100%)',
          animation: 'crossfade4 24s ease-in-out infinite'
        }}
      />
    </>
  );

  const renderFestivalAmbient = () => {
    switch(themeType) {
      case 'diwali':
        return (
          <>
            <div className="ambient-radial-glow" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(255, 138, 61, 0.55) 0%, transparent 100%)', animation: 'crossfade1 16s ease-in-out infinite' }} />
            <div className="ambient-radial-glow" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(143, 61, 61, 0.55) 0%, transparent 100%)', animation: 'crossfade3 16s ease-in-out infinite' }} />
          </>
        );
      case 'christmas':
        return (
          <>
            <div className="ambient-radial-glow" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(173, 216, 230, 0.55) 0%, transparent 100%)', animation: 'crossfade1 16s ease-in-out infinite' }} />
            <div className="ambient-radial-glow" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(212, 36, 38, 0.4) 0%, transparent 100%)', animation: 'crossfade3 16s ease-in-out infinite' }} />
          </>
        );
      case 'pongal':
        return (
          <>
            <div className="ambient-radial-glow" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(224, 122, 95, 0.55) 0%, transparent 100%)', animation: 'crossfade1 16s ease-in-out infinite' }} />
            <div className="ambient-radial-glow" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(61, 64, 91, 0.55) 0%, transparent 100%)', animation: 'crossfade3 16s ease-in-out infinite' }} />
          </>
        );
      case 'valentines':
        return (
          <>
            <div className="ambient-radial-glow" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(230, 57, 70, 0.55) 0%, transparent 100%)', animation: 'crossfade1 16s ease-in-out infinite' }} />
            <div className="ambient-radial-glow" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% -20%, rgba(168, 218, 220, 0.45) 0%, transparent 100%)', animation: 'crossfade3 16s ease-in-out infinite' }} />
          </>
        );
      default:
        return renderDefaultAmbient();
    }
  };

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
        className="absolute top-0 left-0 w-full h-[800px] z-0 pointer-events-none transition-opacity duration-[2500ms] ease-out"
        style={{ opacity: mounted ? baseOpacity : 0 }}
      >
        {showFestival ? renderFestivalAmbient() : renderDefaultAmbient()}
      </div>
    </>
  );
}
