'use client';

import React from 'react';
import { useFestival } from '@/components/providers/FestivalProvider';

export function FestivalDecorations() {
  const { activeFestival, optOut, setOptOut } = useFestival();

  if (!activeFestival || optOut) return null;

  const { theme_type } = activeFestival;

  return (
    <>
      {/* Optional: Add opt-out toggle somewhere discreet, or we can just render the decorations */}
      
      {/* DIWALI - Top Marigold/Light Garland Effect */}
      {theme_type === 'diwali' && (
        <div className="fixed top-0 left-0 w-full h-2 z-[100] bg-gradient-to-r from-yellow-600 via-orange-500 to-red-600 opacity-90 shadow-[0_0_20px_rgba(255,138,61,0.5)]" />
      )}

      {/* CHRISTMAS - Top Frost Effect */}
      {theme_type === 'christmas' && (
        <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-gradient-to-r from-blue-100 via-white to-blue-100 opacity-80 shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
      )}

      {/* PONGAL - Top Leaf/Clay Effect */}
      {theme_type === 'pongal' && (
        <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-gradient-to-r from-green-700 via-yellow-600 to-green-700 opacity-90 shadow-[0_0_15px_rgba(224,122,95,0.4)]" />
      )}

      {/* VALENTINES - Top Crimson Effect */}
      {theme_type === 'valentines' && (
        <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-gradient-to-r from-pink-500 via-red-500 to-pink-500 opacity-90 shadow-[0_0_15px_rgba(230,57,70,0.6)]" />
      )}
      
      {/* 
        You can expand this with more complex SVG/CSS animations for each festival 
        e.g., falling snow for christmas, floating diyas for diwali 
      */}
      
      {/* Opt-out Toggle (Discreetly placed at bottom right for example) */}
      <button 
        onClick={() => setOptOut(true)}
        className="fixed bottom-4 right-4 z-[100] text-[10px] text-white/40 hover:text-white/80 bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/5 transition-all"
        title="Disable Festival Theme"
      >
        Standard Theme
      </button>
    </>
  );
}
