'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Spark {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export function DiwaliSparklers() {
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isMobile ? 12 : 28;

    const newSparks = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 80 + 10,
      size: Math.random() * 3.5 + 1.5,
      duration: Math.random() * 2.5 + 2,
      delay: Math.random() * 3,
    }));

    setSparks(newSparks);
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {sparks.map((spark) => (
        <motion.div
          key={spark.id}
          className="absolute rounded-full"
          style={{
            left: `${spark.x}%`,
            top: `${spark.y}%`,
            width: spark.size,
            height: spark.size,
            backgroundColor: '#FDE047',
            boxShadow: '0 0 10px #F59E0B, 0 0 20px #EF4444',
          }}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0.8, 0],
            scale: [0.2, 1.4, 0.8, 0],
            y: [-10, -60, -110],
            x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40],
          }}
          transition={{
            duration: spark.duration,
            delay: spark.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
