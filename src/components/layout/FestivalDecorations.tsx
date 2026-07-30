'use client';

import React, { useEffect, useState } from 'react';
import { useFestival } from '@/components/providers/FestivalProvider';

export function FestivalDecorations() {
  const { activeFestival, optOut } = useFestival();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !activeFestival || optOut) return null;

  const { theme_type } = activeFestival;

  // Generate some random values for particles to avoid hydration mismatches
  // by only rendering them after mount.
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 5 + 5}s`,
    animationDelay: `${Math.random() * 5}s`,
    size: Math.random() * 4 + 2,
    opacity: Math.random() * 0.5 + 0.3,
  }));

  const renderParticles = (colorClass: string, isFalling = false) => {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className={`absolute rounded-full ${colorClass}`}
            style={{
              left: p.left,
              top: isFalling ? '-5%' : `${Math.random() * 100}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animation: isFalling 
                ? `fall ${p.animationDuration} linear infinite` 
                : `float ${p.animationDuration} ease-in-out infinite`,
              animationDelay: p.animationDelay,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}} />

      {/* DIWALI */}
      {theme_type === 'diwali' && (
        <>
          <div className="fixed top-0 left-0 w-full h-2 z-[100] bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 shadow-[0_0_30px_rgba(255,138,61,0.8)]" />
          {renderParticles('bg-orange-400 shadow-[0_0_10px_rgba(255,165,0,0.8)]')}
        </>
      )}

      {/* CHRISTMAS */}
      {theme_type === 'christmas' && (
        <>
          <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-gradient-to-r from-blue-200 via-white to-blue-200 shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
          {renderParticles('bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]', true)}
        </>
      )}

      {/* PONGAL */}
      {theme_type === 'pongal' && (
        <>
          <div className="fixed top-0 left-0 w-full h-2 z-[100] bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 shadow-[0_0_20px_rgba(224,122,95,0.6)]" />
          {renderParticles('bg-yellow-400 shadow-[0_0_10px_rgba(224,122,95,0.6)]')}
        </>
      )}

      {/* VALENTINES */}
      {theme_type === 'valentines' && (
        <>
          <div className="fixed top-0 left-0 w-full h-2 z-[100] bg-gradient-to-r from-pink-500 via-red-500 to-pink-500 shadow-[0_0_20px_rgba(230,57,70,0.8)]" />
          {renderParticles('bg-pink-400 shadow-[0_0_10px_rgba(230,57,70,0.8)]')}
        </>
      )}
    </>
  );
}
