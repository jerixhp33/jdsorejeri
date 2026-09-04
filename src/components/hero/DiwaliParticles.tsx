'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FestivalParticlesProps {
  color?: string;
  glow?: string;
}

/** Reusable particle engine — accepts custom color/glow for any festival */
export function FestivalParticles({
  color = '#fcd34d',
  glow = 'rgba(252, 211, 77, 0.8)',
}: FestivalParticlesProps) {
  const [particles, setParticles] = useState<Array<{ id: number; left: number; top: number; size: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Generate different amount based on screen size
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 5 : 25;

    const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1, // 1px to 4px
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 4, // 4s to 7s
    }));

    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full will-change-transform"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 8px ${glow}`,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, 0.8, 0],
            y: -50,
            x: Math.random() > 0.5 ? 20 : -20,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/** Backwards-compatible Diwali-specific wrapper */
export function DiwaliParticles() {
  return <FestivalParticles color="#fcd34d" glow="rgba(252, 211, 77, 0.8)" />;
}
