'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { HomeThemeConfig } from '@/lib/theme';

interface Props {
  variant?: 'home' | 'minimal' | 'dark';
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
  themeConfig?: HomeThemeConfig | null;
}

export function JDStoreAmbientBackground({
  intensity = 'medium',
  themeConfig,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // HTML5 Canvas custom PNG falling element particle engine
  useEffect(() => {
    if (!mounted || prefersReducedMotion || !themeConfig?.element_image_url || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      rotation: number;
      rotSpeed: number;
      opacity: number;
    }[] = [];

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = themeConfig.element_image_url;

    const size = themeConfig.element_size || 32;
    const count = Math.min(themeConfig.element_count || 25, 45);
    const speedMult = themeConfig.element_speed === 'fast' ? 2.5 : themeConfig.element_speed === 'slow' ? 0.8 : 1.5;
    const isFloat = themeConfig.element_direction === 'float';

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    img.onload = () => {
      particles = Array.from({ length: count }).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: size,
        speedY: (Math.random() * 1.2 + 0.6) * speedMult * (isFloat ? -1 : 1),
        speedX: (Math.random() - 0.5) * 0.8,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        opacity: Math.random() * 0.5 + 0.5,
      }));

      const loop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p) => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;

          ctx.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size);

          ctx.restore();

          p.y += p.speedY;
          p.x += p.speedX + Math.sin(p.y * 0.01) * 0.3;
          p.rotation += p.rotSpeed;

          if (isFloat) {
            if (p.y < -p.size) {
              p.y = canvas.height + p.size;
              p.x = Math.random() * canvas.width;
            }
          } else {
            if (p.y > canvas.height + p.size) {
              p.y = -p.size;
              p.x = Math.random() * canvas.width;
            }
          }
        });

        animId = requestAnimationFrame(loop);
      };

      loop();
    };

    return () => {
      window.removeEventListener('resize', resize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [mounted, prefersReducedMotion, themeConfig]);

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
    high: 1.3,
  };
  const baseOpacity = opacityMap[intensity];

  const primaryGlow = themeConfig?.glow_primary_color || 'rgba(0, 242, 254, 0.55)';
  const secondaryGlow = themeConfig?.glow_secondary_color || 'rgba(240, 147, 251, 0.55)';

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

      {/* Base Black Background - FIXED */}
      <div className="fixed inset-0 z-0 bg-[#0a0a0a] pointer-events-none" />

      {/* Top Ambient Aura Glow */}
      <div 
        className="absolute top-0 left-0 w-full h-[800px] z-0 pointer-events-none transition-opacity duration-[2500ms] ease-out"
        style={{ opacity: mounted ? baseOpacity : 0 }}
      >
        <div 
          className="ambient-radial-glow"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 50% -20%, ${primaryGlow} 0%, transparent 100%)`,
            animation: 'crossfade1 20s ease-in-out infinite'
          }}
        />
        <div 
          className="ambient-radial-glow"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 50% -20%, ${secondaryGlow} 0%, transparent 100%)`,
            animation: 'crossfade2 20s ease-in-out infinite'
          }}
        />
      </div>

      {/* Canvas Layer for Custom PNG Particles */}
      {themeConfig?.element_image_url && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 z-[15] pointer-events-none overflow-hidden"
          style={{ opacity: mounted ? 1 : 0, transition: 'opacity 1s ease-in-out' }}
        />
      )}
    </>
  );
}
