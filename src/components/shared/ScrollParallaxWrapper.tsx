'use client';

import { motion } from 'framer-motion';

interface ScrollParallaxWrapperProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'none';
  className?: string;
}

export function ScrollParallaxWrapper({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}: ScrollParallaxWrapperProps) {
  const yOffset = direction === 'up' ? 24 : direction === 'down' ? -24 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
