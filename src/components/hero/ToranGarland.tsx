'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function ToranGarland() {
  return (
    <div className="w-full overflow-hidden z-20 pointer-events-none h-16 md:h-20">
      <motion.svg
        viewBox="0 0 1200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMin slice"
        className="w-full h-full preserve-3d will-change-transform"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0, rotate: [-0.5, 0.5, -0.5] }}
        transition={{ 
          opacity: { duration: 1 }, 
          y: { duration: 1 }, 
          rotate: { duration: 6, repeat: Infinity, ease: 'easeInOut' } 
        }}
      >
        <defs>
          <linearGradient id="mangoLeafGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2D6A4F" />
            <stop offset="50%" stopColor="#1B4332" />
            <stop offset="100%" stopColor="#081C15" />
          </linearGradient>

          <linearGradient id="marigoldGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient id="marigoldGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
        </defs>

        {/* Main Hanging Rope Thread */}
        <path d="M0 15 Q300 45 600 15 Q900 45 1200 15" stroke="#78350F" strokeWidth="3" fill="none" />

        {/* Repeating Toran Segments across 1200px SVG width */}
        {Array.from({ length: 12 }).map((_, i) => {
          const xPos = i * 100 + 50;
          const leafY = 15 + Math.sin((i / 12) * Math.PI * 2) * 10;
          return (
            <g key={i} transform={`translate(${xPos}, ${leafY})`}>
              {/* Mango Leaf Pair */}
              <path 
                d="M-15 0 C-25 30 -20 65 0 85 C20 65 25 30 15 0 Z" 
                fill="url(#mangoLeafGrad)" 
                stroke="#1B4332" 
                strokeWidth="1" 
              />
              <path d="M0 0 L0 80" stroke="#74C69D" strokeWidth="1" opacity="0.6" />

              {/* Marigold Flowers at Top of Leaf */}
              <circle cx="-12" cy="10" r="10" fill="url(#marigoldGrad1)" />
              <circle cx="12" cy="10" r="10" fill="url(#marigoldGrad2)" />
              <circle cx="0" cy="5" r="12" fill="url(#marigoldGrad1)" />

              {/* Little Brass Bell hanging below */}
              <path d="M-4 85 L4 85 L6 96 L-6 96 Z" fill="#F59E0B" />
              <circle cx="0" cy="98" r="3" fill="#B45309" />
            </g>
          );
        })}
      </motion.svg>
    </div>
  );
}
