'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

export type Preset3D =
  | 'tilt-flip'
  | 'card-fan'
  | 'depth-arc'
  | 'film-layer'
  | 'isometric-pillar'
  | 'unfold-fold';

interface Section3DTransitionProps {
  children: React.ReactNode;
  preset?: Preset3D;
  delay?: number;
  duration?: number;
  className?: string;
  depthPerspective?: number;
}

const presetVariants: Record<Preset3D, Variants> = {
  'tilt-flip': {
    hidden: {
      opacity: 0,
      rotateX: 10,
      translateZ: -50,
      scale: 0.96,
      y: 30,
    },
    visible: {
      opacity: 1,
      rotateX: 0,
      translateZ: 0,
      scale: 1,
      y: 0,
    },
  },
  'card-fan': {
    hidden: {
      opacity: 0,
      rotateY: -6,
      rotateX: 6,
      scale: 0.95,
      y: 25,
    },
    visible: {
      opacity: 1,
      rotateY: 0,
      rotateX: 0,
      scale: 1,
      y: 0,
    },
  },
  'depth-arc': {
    hidden: {
      opacity: 0,
      translateZ: -80,
      scale: 0.93,
      rotateX: 4,
      y: 35,
    },
    visible: {
      opacity: 1,
      translateZ: 0,
      scale: 1,
      rotateX: 0,
      y: 0,
    },
  },
  'film-layer': {
    hidden: {
      opacity: 0,
      y: 45,
      translateZ: -30,
      rotateX: 5,
      scale: 0.97,
    },
    visible: {
      opacity: 1,
      y: 0,
      translateZ: 0,
      rotateX: 0,
      scale: 1,
    },
  },
  'isometric-pillar': {
    hidden: {
      opacity: 0,
      rotateX: 12,
      rotateY: -4,
      y: 35,
      scale: 0.94,
    },
    visible: {
      opacity: 1,
      rotateX: 0,
      rotateY: 0,
      y: 0,
      scale: 1,
    },
  },
  'unfold-fold': {
    hidden: {
      opacity: 0,
      rotateX: -12,
      y: -20,
      scale: 0.96,
    },
    visible: {
      opacity: 1,
      rotateX: 0,
      y: 0,
      scale: 1,
    },
  },
};

export function Section3DTransition({
  children,
  preset = 'tilt-flip',
  delay = 0,
  duration = 0.7,
  className = '',
  depthPerspective = 1000,
}: Section3DTransitionProps) {
  const selectedVariant = presetVariants[preset] || presetVariants['tilt-flip'];

  return (
    <div
      className={`w-full relative ${className}`}
      style={{
        perspective: `${depthPerspective}px`,
        perspectiveOrigin: 'center 40%',
      }}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={selectedVariant}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
