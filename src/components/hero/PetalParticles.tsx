'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function PetalSVG({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 20 20" fill={color} xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
      <path d="M10 2 C15 5, 18 10, 10 18 C2 10, 5 5, 10 2Z" />
    </svg>
  );
}

export function PetalParticles() {
  const [petals, setPetals] = useState<Array<{ id: number; left: number; top: number; size: number; delay: number; duration: number; rotate: number; color: string }>>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // The user requested "2-3 small floating flower petals" - let's render 4 or 5 max for subtlety
    const colors = ['#D96C32', '#E88B41', '#D9945B'];
    
    const newPetals = Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: 110 + Math.random() * 20, // start slightly below the screen
      size: Math.random() * 8 + 12, // 12px to 20px
      delay: Math.random() * 5,
      duration: Math.random() * 5 + 8, // 8s to 13s (slow drift)
      rotate: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    setPetals(newPetals);
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          className="absolute will-change-transform"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
          }}
          initial={{ opacity: 0, y: 0, rotate: p.rotate }}
          animate={{
            opacity: [0, 0.8, 0],
            y: -300, // drift up slowly
            x: Math.random() > 0.5 ? 40 : -40,
            rotate: p.rotate + (Math.random() > 0.5 ? 180 : -180)
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <PetalSVG color={p.color} />
        </motion.div>
      ))}
    </div>
  );
}
