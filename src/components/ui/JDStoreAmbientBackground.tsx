'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
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

  // Multi-element HTML5 Canvas particle engine with auto-background-removal
  useEffect(() => {
    const rawUrls = themeConfig?.element_images && themeConfig.element_images.length > 0
      ? themeConfig.element_images
      : themeConfig?.element_image_url
      ? [themeConfig.element_image_url]
      : [];

    if (!mounted || prefersReducedMotion || rawUrls.length === 0 || !canvasRef.current) {
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
      imgIndex: number;
    }[] = [];

    const size = themeConfig?.element_size || 32;
    const count = Math.min(themeConfig?.element_count || 25, 50);
    const speedMult = themeConfig?.element_speed === 'fast' ? 2.2 : themeConfig?.element_speed === 'slow' ? 0.8 : 1.4;
    const isFloat = themeConfig?.element_direction === 'float';

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Preload & filter background pixels for ALL uploaded element images
    const loadPromises = rawUrls.map((url) => {
      return new Promise<HTMLCanvasElement | null>((resolve) => {
        const rawImg = new Image();
        rawImg.crossOrigin = 'anonymous';
        rawImg.src = url;

        rawImg.onload = () => {
          const offCanvas = document.createElement('canvas');
          offCanvas.width = rawImg.width;
          offCanvas.height = rawImg.height;
          const offCtx = offCanvas.getContext('2d');
          if (!offCtx) return resolve(null);

          offCtx.drawImage(rawImg, 0, 0);
          const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
          const d = imgData.data;

          // Filter out pure white and light grey background pixels
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            if (r > 215 && g > 215 && b > 215) {
              d[i + 3] = 0; // Make transparent
            }
          }
          offCtx.putImageData(imgData, 0, 0);
          resolve(offCanvas);
        };

        rawImg.onerror = () => resolve(null);
      });
    });

    Promise.all(loadPromises).then((loadedCanvases) => {
      const validCanvases = loadedCanvases.filter((c): c is HTMLCanvasElement => c !== null);
      if (validCanvases.length === 0) return;

      // Create particle instances with random image selection from validCanvases
      particles = Array.from({ length: count }).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: size,
        speedY: (Math.random() * 1.2 + 0.6) * speedMult * (isFloat ? -1 : 1),
        speedX: (Math.random() - 0.5) * 0.8,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        opacity: Math.random() * 0.5 + 0.5,
        imgIndex: Math.floor(Math.random() * validCanvases.length),
      }));

      const loop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p) => {
          const offCanvas = validCanvases[p.imgIndex];
          if (!offCanvas) return;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;

          ctx.drawImage(offCanvas, -p.size / 2, -p.size / 2, p.size, p.size);

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
    });

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
  const secondaryGlow = themeConfig?.glow_secondary_color || 'rgba(79, 172, 254, 0.55)';
  const tertiaryGlow = themeConfig?.glow_tertiary_color || 'rgba(240, 147, 251, 0.55)';
  const quaternaryGlow = themeConfig?.glow_quaternary_color || 'rgba(0, 255, 135, 0.55)';
  const accentColor = themeConfig?.text_accent_color || '#c8a96e';
  const bgMediaUrl = themeConfig?.home_bg_media_url;
  const bgMediaType = themeConfig?.home_bg_media_type || 'image';
  const bgOpacity = themeConfig?.home_bg_opacity ?? 0.35;

  const hasElements = (themeConfig?.element_images && themeConfig.element_images.length > 0) || Boolean(themeConfig?.element_image_url);

  return (
    <>
      {/* Global Text Accent & Luxe Accent binding */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --luxe-accent: ${accentColor} !important;
        }
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

      {/* Base Black Background */}
      <div className="fixed inset-0 z-0 bg-[#0a0a0a] pointer-events-none" />

      {/* Full Home Background Media (Video or Image) */}
      {bgMediaUrl && (
        <div
          className="fixed inset-0 z-[1] pointer-events-none overflow-hidden transition-opacity duration-1000"
          style={{ opacity: bgOpacity }}
        >
          {bgMediaType === 'video' ? (
            <video
              src={bgMediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <Image src={bgMediaUrl} alt="Background" fill priority sizes="100vw" className="object-cover" />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Full 4-Layer Dynamic Ambient Aura Glow */}
      <div 
        className="absolute top-0 left-0 w-full h-[800px] z-[2] pointer-events-none transition-opacity duration-[2500ms] ease-out"
        style={{ opacity: mounted ? baseOpacity : 0 }}
      >
        {/* Layer 1: Color 1 (Default: Teal / Cyan) */}
        <div 
          className="ambient-radial-glow"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 50% -20%, ${primaryGlow} 0%, transparent 100%)`,
            animation: 'crossfade1 24s ease-in-out infinite'
          }}
        />
        {/* Layer 2: Color 2 (Default: Sky Blue) */}
        <div 
          className="ambient-radial-glow"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 50% -20%, ${secondaryGlow} 0%, transparent 100%)`,
            animation: 'crossfade2 24s ease-in-out infinite'
          }}
        />
        {/* Layer 3: Color 3 (Default: Purple / Pink) */}
        <div 
          className="ambient-radial-glow"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 50% -20%, ${tertiaryGlow} 0%, transparent 100%)`,
            animation: 'crossfade3 24s ease-in-out infinite'
          }}
        />
        {/* Layer 4: Color 4 (Default: Electric Mint) */}
        <div 
          className="ambient-radial-glow"
          style={{
            background: `radial-gradient(ellipse 100% 100% at 50% -20%, ${quaternaryGlow} 0%, transparent 100%)`,
            animation: 'crossfade4 24s ease-in-out infinite'
          }}
        />
      </div>

      {/* Canvas Layer for Multi-Element Transparent PNG Particles */}
      {hasElements && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 z-[15] pointer-events-none overflow-hidden"
          style={{ opacity: mounted ? 1 : 0, transition: 'opacity 1s ease-in-out' }}
        />
      )}
    </>
  );
}
