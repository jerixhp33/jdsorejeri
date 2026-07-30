'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useFestival } from '@/components/providers/FestivalProvider';

export function FestivalDecorations() {
  const { activeFestival, optOut } = useFestival();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show decorations on the home page
  if (!mounted || !activeFestival || optOut || pathname !== '/') return null;

  const { theme_type } = activeFestival;

  // Generate some random values for particles to avoid hydration mismatches
  // by only rendering them after mount.
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 5 + 5}s`,
    animationDelay: `${Math.random() * 5}s`,
    size: Math.random() * 6 + 4,
    opacity: Math.random() * 0.6 + 0.4,
  }));

  const renderParticles = (colorClass: string, isFalling = false) => {
    return (
      <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden" aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            className={`absolute rounded-full ${colorClass}`}
            style={{
              left: p.left,
              top: isFalling ? '-10%' : `${Math.random() * 100}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animation: isFalling 
                ? `fall ${p.animationDuration} linear infinite` 
                : `float ${p.animationDuration} ease-in-out infinite, pulse ${p.animationDuration} ease-in-out infinite`,
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
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.3); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}} />

      {/* DIWALI */}
      {theme_type === 'diwali' && (
        <>
          {renderParticles('bg-gradient-to-tr from-yellow-400 to-orange-500 shadow-[0_0_12px_rgba(255,165,0,1)]')}
        </>
      )}

      {/* CHRISTMAS */}
      {theme_type === 'christmas' && (
        <>
          {renderParticles('bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] blur-[0.5px]', true)}
        </>
      )}

      {/* PONGAL */}
      {theme_type === 'pongal' && (
        <>
          {renderParticles('bg-gradient-to-t from-orange-400 to-yellow-300 shadow-[0_0_10px_rgba(249,168,37,0.8)]')}
        </>
      )}

      {/* VALENTINES */}
      {theme_type === 'valentines' && (
        <>
          {renderParticles('bg-gradient-to-tr from-pink-400 to-red-500 shadow-[0_0_12px_rgba(255,64,129,0.8)]')}
        </>
      )}
    </>
  );
}
