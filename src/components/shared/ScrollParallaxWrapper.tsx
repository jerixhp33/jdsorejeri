'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface ScrollParallaxWrapperProps {
  children: React.ReactNode;
  speed?: number; // e.g. -20 to 20 for parallax offset
  scaleIn?: boolean;
  className?: string;
}

export function ScrollParallaxWrapper({
  children,
  speed = 0,
  scaleIn = true,
  className = '',
}: ScrollParallaxWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.001,
  });

  const y = useTransform(smoothProgress, [0, 1], [speed * 2, speed * -2]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], scaleIn ? [0.96, 1, 0.98] : [1, 1, 1]);
  const opacity = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.7]);

  return (
    <motion.div
      ref={containerRef}
      style={{ y, scale, opacity }}
      className={`will-change-transform transform-gpu ${className}`}
    >
      {children}
    </motion.div>
  );
}
