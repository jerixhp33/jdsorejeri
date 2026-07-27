'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JDLogo } from '@/components/shared/JDLogo';

export function PageLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Keep loader visible for 1.2s to show off animation, then fade out
    const t = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // Generate 60 magical particles deterministically
  const particles = Array.from({ length: 60 }).map((_, i) => {
    // Golden angle distribution for natural starry look
    const angle = (i * 137.5) % 360; 
    // Radius between 70px and 240px
    const radius = 70 + ((i * 61) % 170); 
    const size = 1 + ((i * 17) % 3);
    const delay = (i * 0.13) % 2;
    const duration = 2 + ((i * 7) % 3);
    
    // Polar to Cartesian
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;

    return { x, y, size, delay, duration };
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070707] overflow-hidden"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes floatParticle {
              0%, 100% { transform: translate(var(--x), var(--y)) scale(1); opacity: 0.1; }
              50% { transform: translate(var(--x), var(--y)) scale(1.8); opacity: 0.9; }
            }
            @keyframes orbit {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes orbitReverse {
              0% { transform: rotate(360deg); }
              100% { transform: rotate(0deg); }
            }
            @keyframes constellationRotate {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(10deg); }
            }
          `}} />

          {/* Central Blended Glow */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)' }}
          />

          <div 
            className="relative flex items-center justify-center"
            style={{ animation: 'constellationRotate 20s linear infinite' }}
          >
            {/* Particles */}
            {particles.map((p, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                style={{
                  width: p.size,
                  height: p.size,
                  '--x': `${p.x}px`,
                  '--y': `${p.y}px`,
                  transform: `translate(${p.x}px, ${p.y}px)`,
                  animation: `floatParticle ${p.duration}s ease-in-out infinite`,
                  animationDelay: `${p.delay}s`,
                } as React.CSSProperties}
              />
            ))}

            {/* Orbiting Ring 1 (Inner Swoosh) */}
            <div 
              className="absolute w-[180px] h-[180px] rounded-full border border-white/5 border-t-white/60 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              style={{ animation: 'orbit 3s linear infinite' }}
            />
            
            {/* Orbiting Ring 2 (Outer Swoosh) */}
            <div 
              className="absolute w-[220px] h-[220px] rounded-full border border-white/5 border-b-white/40"
              style={{ animation: 'orbitReverse 5s linear infinite' }}
            />

            {/* JD Logo with Counter-Rotation to keep it upright */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative z-10"
              style={{ 
                animation: 'orbitReverse 20s linear infinite',
                filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.5))' 
              }}
            >
              <JDLogo size={85} />
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}