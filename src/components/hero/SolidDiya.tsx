import React from 'react';
import { motion } from 'framer-motion';

export function SolidDiya({ className = "w-full h-full", id = 'diya' }: { className?: string, id?: string }) {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        {/* Brass Diya Base Gradient */}
        <linearGradient id={`${id}-brassGradient`} x1="20" y1="100" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="40%" stopColor="#D97706" />
          <stop offset="70%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Diya Rim Highlight */}
        <linearGradient id={`${id}-brassHighlight`} x1="30" y1="100" x2="170" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Outer Flame (Warm Saffron/Orange) */}
        <linearGradient id={`${id}-outerFlame`} x1="100" y1="110" x2="100" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="80%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FEF08A" />
        </linearGradient>

        {/* Inner Flame (Pure Golden Yellow) */}
        <linearGradient id={`${id}-innerFlame`} x1="100" y1="105" x2="100" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="60%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>

        {/* Oil Pool Interior */}
        <linearGradient id={`${id}-oilPool`} x1="40" y1="110" x2="160" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="50%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
      </defs>

      {/* Shadow Base */}
      <ellipse cx="100" cy="182" rx="65" ry="12" fill="#2E1E12" fillOpacity="0.25" />

      {/* Flame Group with Organic Motion Flicker */}
      <motion.g
        style={{ transformOrigin: '100px 110px', transformBox: 'view-box' }}
        animate={{ 
          scaleY: [1, 1.06, 0.97, 1.04, 0.98, 1],
          skewX: [-1, 1.5, -1, 0.5, -0.5, -1],
          opacity: [0.95, 1, 0.9, 1, 0.92, 0.95]
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Flame Outer Shell */}
        <path 
          d="M100 20 C115 50 130 75 125 95 C120 115 108 122 100 122 C92 122 80 115 75 95 C70 75 85 50 100 20 Z" 
          fill={`url(#${id}-outerFlame)`} 
        />

        {/* Flame Inner Core */}
        <path 
          d="M100 45 C108 65 116 80 112 95 C109 108 104 112 100 112 C96 112 91 108 88 95 C84 80 92 65 100 45 Z" 
          fill={`url(#${id}-innerFlame)`} 
        />
      </motion.g>

      {/* Diya Lamp Base - Solid Brass Bowl */}
      <path 
        d="M25 110 C25 110 35 170 100 172 C165 170 175 110 175 110 C175 110 145 130 100 130 C55 130 25 110 25 110 Z" 
        fill={`url(#${id}-brassGradient)`} 
        stroke="#92400E" 
        strokeWidth="2" 
      />

      {/* Diya Inner Lip / Oil Well */}
      <ellipse cx="100" cy="110" rx="75" ry="18" fill={`url(#${id}-oilPool)`} stroke="#D97706" strokeWidth="2" />

      {/* Diya Rim Front Highlight */}
      <path 
        d="M25 110 C50 126 150 126 175 110 C155 122 45 122 25 110 Z" 
        fill={`url(#${id}-brassHighlight)`} 
      />

      {/* Traditional Carved Pattern Detailing on Bowl */}
      <path d="M50 132 C65 148 78 155 100 156 C122 155 135 148 150 132" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M68 148 C80 160 90 164 100 164 C110 164 120 160 132 148" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

      {/* Small Cotton Wick Accent */}
      <path d="M100 112 L100 100" stroke="#451A03" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
