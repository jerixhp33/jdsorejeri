'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFestival } from '@/components/providers/FestivalProvider';
import { FESTIVAL_CONFIGS } from '@/lib/festival/configs';

export function JDStoreAmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  const { activeFestival, optOut } = useFestival();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      // Height can be just the top portion if we only want it at the top, or full window.
      canvas.height = Math.max(800, window.innerHeight); 
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const config = (activeFestival && !optOut) 
      ? FESTIVAL_CONFIGS[activeFestival.theme_type] 
      : null;

    // Base default gradients if no festival
    const defaultGradients = [
      'rgba(200, 169, 110, 0.1)', // Gold
      'rgba(20, 20, 20, 0.05)',
      'transparent'
    ];

    const currentGradients = config ? config.gradients : defaultGradients;

    // Capped particle count based on hardware
    const maxCount = config ? config.baseCount : 0;
    const hardwareCap = (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 4) <= 4) ? 0.5 : 1;
    const particleCount = Math.floor(maxCount * hardwareCap);

    if (config && !prefersReducedMotion && particleCount > 0) {
      // Initialize particles based on type
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: config.particleType === 'snow' ? Math.random() * 1 + 0.5 : (Math.random() - 0.5) * 0.5,
          angle: Math.random() * Math.PI * 2,
          opacity: Math.random() * 0.5 + 0.1,
          life: Math.random() * 100
        });
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Layer 1: Radial Gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, 0, 0,
        canvas.width / 2, 0, canvas.width * 0.8
      );
      gradient.addColorStop(0, currentGradients[0]);
      gradient.addColorStop(0.5, currentGradients[1]);
      gradient.addColorStop(1, currentGradients[2]);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Layer 2: Particles
      if (config && !prefersReducedMotion) {
        particles.forEach(p => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          
          ctx.fillStyle = `rgba(${config.glowColor}, ${p.opacity})`;
          
          if (config.particleType === 'snow') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
            p.y += p.speedY;
            p.x += Math.sin(p.life * 0.05) * 0.5;
            if (p.y > canvas.height) {
              p.y = -10;
              p.x = Math.random() * canvas.width;
            }
          } else if (config.particleType === 'sparkle') {
            const pulse = Math.abs(Math.sin(p.life * 0.05));
            ctx.fillStyle = `rgba(${config.glowColor}, ${p.opacity * pulse})`;
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            p.y -= 0.5; // Float up
            if (p.y < -10) p.y = canvas.height + 10;
          } else if (config.particleType === 'firefly') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
            ctx.fill();
            p.x += Math.sin(p.life * 0.02) * 1.5;
            p.y += Math.cos(p.life * 0.02) * 1.5;
          } else if (config.particleType === 'fog') {
            ctx.fillStyle = `rgba(${config.glowColor}, ${p.opacity * 0.2})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 10, p.size * 5, 0, 0, Math.PI * 2);
            ctx.fill();
            p.x += 0.2;
            if (p.x > canvas.width + 100) p.x = -100;
          } else if (config.particleType === 'burst') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
            p.x += p.speedX * 2;
            p.y += p.speedY * 2;
            p.opacity -= 0.005;
            if (p.opacity <= 0) {
              p.x = Math.random() * canvas.width;
              p.y = Math.random() * canvas.height;
              p.opacity = Math.random() * 0.5 + 0.1;
            }
          }
          
          p.life++;
          p.angle += 0.01;
          ctx.restore();
        });
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [mounted, activeFestival, optOut, prefersReducedMotion]);

  return (
    <>
      <div className="fixed inset-0 z-0 bg-background pointer-events-none transition-colors duration-500" />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full pointer-events-none z-0 transition-opacity duration-1000"
        style={{ opacity: mounted ? 1 : 0 }}
      />
    </>
  );
}
