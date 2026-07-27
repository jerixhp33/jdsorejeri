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
    // Check reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', motionHandler);

    // Trigger mount animation
    const timer = setTimeout(() => setMounted(true), 100);

    return () => {
      mediaQuery.removeEventListener('change', motionHandler);
      clearTimeout(timer);
    };
  }, []);

  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 z-0 bg-[#030303] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808] to-[#030303]" />
      </div>
    );
  }

  const opacityMap = {
    low: 0.5,
    medium: 0.8,
    high: 1.2
  };
  const baseOpacity = opacityMap[intensity];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes colorShift1 {
          0% { background: #9B8AFB; }
          33% { background: #6FBFC4; }
          66% { background: #C58FA5; }
          100% { background: #9B8AFB; }
        }
        @keyframes colorShift2 {
          0% { background: #E6D5B8; }
          33% { background: #7FA58A; }
          66% { background: #6B3045; }
          100% { background: #E6D5B8; }
        }
        @keyframes colorShift3 {
          0% { background: #C9A96E; }
          33% { background: #9B8AFB; }
          66% { background: #7FA58A; }
          100% { background: #C9A96E; }
        }
        @keyframes driftHorizontal1 {
          0% { transform: translateX(-5%); }
          50% { transform: translateX(5%); }
          100% { transform: translateX(-5%); }
        }
        @keyframes driftHorizontal2 {
          0% { transform: translateX(5%); }
          50% { transform: translateX(-5%); }
          100% { transform: translateX(5%); }
        }
        @keyframes driftHorizontal3 {
          0% { transform: translateX(-3%); }
          50% { transform: translateX(3%); }
          100% { transform: translateX(-3%); }
        }

        .ambient-top-layer {
          position: absolute;
          border-radius: 100%;
          mix-blend-mode: screen;
          pointer-events: none;
        }

        .glow-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 450px;
          pointer-events: none;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);
        }

        .ambient-noise {
          position: absolute;
          inset: -100%;
          width: 300%;
          height: 300%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.015;
          pointer-events: none;
          z-index: 6;
        }
      `}} />

      <div className="fixed inset-0 z-0 bg-[#030303] pointer-events-none overflow-hidden">
        {/* Charcoal Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060606] to-[#030303]" />

        {/* Top Glow Wrapper with Mask to completely prevent bottom bleeding */}
        <div 
          className="glow-wrapper transition-opacity duration-[2000ms] ease-out"
          style={{ opacity: mounted ? 1 : 0 }}
        >
          {/* Glow 1 - Left Side */}
          <div 
            className="ambient-top-layer"
            style={{
              top: '-150px',
              left: '-10%',
              width: '70%',
              height: '350px',
              filter: 'blur(120px)',
              opacity: 0.5 * baseOpacity,
              animation: 'colorShift1 24s ease-in-out infinite, driftHorizontal1 18s ease-in-out infinite'
            }}
          />

          {/* Glow 2 - Right Side */}
          <div 
            className="ambient-top-layer"
            style={{
              top: '-150px',
              right: '-10%',
              width: '70%',
              height: '350px',
              filter: 'blur(120px)',
              opacity: 0.45 * baseOpacity,
              animation: 'colorShift2 28s ease-in-out infinite, driftHorizontal2 22s ease-in-out infinite'
            }}
          />

          {/* Glow 3 - Center Overlay */}
          <div 
            className="ambient-top-layer"
            style={{
              top: '-100px',
              left: '20%',
              width: '60%',
              height: '300px',
              filter: 'blur(100px)',
              opacity: 0.4 * baseOpacity,
              animation: 'colorShift3 32s ease-in-out infinite, driftHorizontal3 25s ease-in-out infinite'
            }}
          />
        </div>

        <div className="ambient-noise" />
      </div>
    </>
  );
}
