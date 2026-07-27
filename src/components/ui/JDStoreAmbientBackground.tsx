'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, useScroll } from 'framer-motion';

interface Props {
  variant?: 'home' | 'minimal' | 'dark';
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
}

export function JDStoreAmbientBackground({ variant = 'home', intensity = 'medium', interactive = true }: Props) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Scroll position mapping
  const { scrollY } = useScroll();
  const scrollYSpring = useSpring(scrollY, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const bgY = useTransform(scrollYSpring, [0, 2000], [0, 50]);

  useEffect(() => {
    // Check mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', motionHandler);

    return () => {
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', motionHandler);
    };
  }, []);

  useEffect(() => {
    if (isMobile || !interactive || prefersReducedMotion) return;

    let rafId: number;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      // Lerp
      currentX += (targetX - currentX) * 0.03;
      currentY += (targetY - currentY) * 0.03;
      
      const xOffset = ((currentX / window.innerWidth) - 0.5) * 30; // Max movement 15px
      const yOffset = ((currentY / window.innerHeight) - 0.5) * 30;

      setMousePosition({ x: xOffset, y: yOffset });
      rafId = requestAnimationFrame(animate);
    };
    
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [isMobile, interactive, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 z-0 bg-[#030303] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808] to-[#030303]" />
      </div>
    );
  }

  const opacityMap = {
    low: 0.6,
    medium: 1,
    high: 1.3
  };
  const baseOpacity = opacityMap[intensity];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ambientDrift1 {
          0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); opacity: 0.7; }
          25% { transform: translate3d(5%, 3%, 0) scale(1.06) rotate(2deg); opacity: 0.8; }
          50% { transform: translate3d(2%, 7%, 0) scale(1.12) rotate(-1deg); opacity: 0.65; }
          75% { transform: translate3d(-3%, 2%, 0) scale(1.05) rotate(1deg); opacity: 0.78; }
          100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); opacity: 0.7; }
        }
        @keyframes ambientDrift2 {
          0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); opacity: 0.6; }
          33% { transform: translate3d(-4%, -5%, 0) scale(1.08) rotate(-3deg); opacity: 0.75; }
          66% { transform: translate3d(-8%, 2%, 0) scale(0.95) rotate(2deg); opacity: 0.5; }
          100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); opacity: 0.6; }
        }
        @keyframes ambientDrift3 {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate3d(6%, -2%, 0) scale(1.1); opacity: 0.7; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.5; }
        }
        @keyframes ambientDrift4 {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate3d(-2%, 8%, 0) scale(1.15); opacity: 0.65; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.4; }
        }
        @keyframes ambientDrift5 {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate3d(3%, 3%, 0) scale(1.05); opacity: 0.6; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.4; }
        }
        @keyframes ambientDrift6 {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate3d(-5%, -5%, 0) scale(1.1); opacity: 0.75; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.5; }
        }
        
        .ambient-layer {
          position: absolute;
          border-radius: 50%;
          mix-blend-mode: screen;
          pointer-events: none;
          will-change: transform, opacity;
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

        .ambient-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 30%, rgba(3,3,3,0.6) 100%);
          pointer-events: none;
          z-index: 7;
        }
      `}} />

      <div className="fixed inset-0 z-0 bg-[#030303] pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Charcoal Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808] to-[#030303] opacity-80" />

        {/* Scroll Parallax Wrapper */}
        <motion.div className="absolute inset-0 w-full h-full" style={{ y: bgY }}>
          {/* Mouse Interaction Wrapper */}
          <motion.div 
            className="absolute inset-0 w-full h-full"
            style={{ 
              x: isMobile ? 0 : mousePosition.x,
              y: isMobile ? 0 : mousePosition.y,
            }}
          >
          {/* Light 01 - Lavender */}
          <div 
            className="ambient-layer bg-[#9B8AFB]"
            style={{
              top: '-10%',
              left: '10%',
              width: isMobile ? '400px' : '650px',
              height: isMobile ? '400px' : '650px',
              filter: isMobile ? 'blur(120px)' : 'blur(200px)',
              opacity: 0.12 * baseOpacity,
              animation: 'ambientDrift1 24s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              transformOrigin: 'center center'
            }}
          />

          {/* Light 02 - Muted Cyan */}
          <div 
            className="ambient-layer bg-[#6FBFC4]"
            style={{
              bottom: '-5%',
              right: '-5%',
              width: isMobile ? '450px' : '750px',
              height: isMobile ? '450px' : '750px',
              filter: isMobile ? 'blur(140px)' : 'blur(220px)',
              opacity: 0.09 * baseOpacity,
              animation: 'ambientDrift2 27s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              animationDelay: '-5s',
            }}
          />

          {/* Light 03 - Dusty Rose */}
          <div 
            className="ambient-layer bg-[#C58FA5]"
            style={{
              top: '30%',
              left: '-10%',
              width: isMobile ? '350px' : '550px',
              height: isMobile ? '350px' : '550px',
              filter: isMobile ? 'blur(130px)' : 'blur(190px)',
              opacity: 0.08 * baseOpacity,
              animation: 'ambientDrift3 31s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              animationDelay: '-12s',
            }}
          />

          {/* Light 04 - Soft Sage */}
          {(!isMobile || variant === 'home') && (
            <div 
              className="ambient-layer bg-[#7FA58A]"
              style={{
                bottom: '10%',
                left: '20%',
                width: isMobile ? '400px' : '650px',
                height: isMobile ? '400px' : '650px',
                filter: isMobile ? 'blur(140px)' : 'blur(220px)',
                opacity: 0.07 * baseOpacity,
                animation: 'ambientDrift4 35s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                animationDelay: '-2s',
              }}
            />
          )}

          {/* Light 05 - Warm Cream */}
          <div 
            className="ambient-layer bg-[#E6D5B8]"
            style={{
              top: '15%',
              right: '25%',
              width: isMobile ? '300px' : '500px',
              height: isMobile ? '300px' : '500px',
              filter: isMobile ? 'blur(110px)' : 'blur(180px)',
              opacity: 0.06 * baseOpacity,
              animation: 'ambientDrift5 21s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              animationDelay: '-8s',
            }}
          />

          {/* Light 06 - Burgundy */}
          {(!isMobile) && (
            <div 
              className="ambient-layer bg-[#6B3045]"
              style={{
                bottom: '20%',
                right: '15%',
                width: '600px',
                height: '600px',
                filter: 'blur(240px)',
                opacity: 0.07 * baseOpacity,
                animation: 'ambientDrift6 39s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                animationDelay: '-15s',
              }}
            />
          )}

          {/* Light 07 - Optional Champagne */}
          {(!isMobile && variant === 'home') && (
            <div 
              className="ambient-layer bg-[#C9A96E]"
              style={{
                top: '40%',
                left: '40%',
                width: '400px',
                height: '400px',
                filter: 'blur(210px)',
                opacity: 0.035 * baseOpacity,
                animation: 'ambientDrift1 29s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse',
              }}
            />
          )}
          </motion.div>
        </motion.div>

        <div className="ambient-noise" />
        <div className="ambient-vignette" />
      </div>
    </>
  );
}
