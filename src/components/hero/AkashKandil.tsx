'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function AkashKandil({ className = "w-full h-full", id = 'kandil' }: { className?: string, id?: string }) {
  return (
    <motion.svg 
      viewBox="0 0 160 300" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      animate={{ rotate: [-2.5, 2.5, -2.5] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: 'top center' }}
    >
      <defs>
        {/* Lantern Core Glow */}
        <radialGradient id={`${id}-kandilGlow`} cx="80" cy="110" r="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`${id}-kandilGold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        <linearGradient id={`${id}-kandilCrimson`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
      </defs>

      {/* Hanging Cord */}
      <line x1="80" y1="0" x2="80" y2="40" stroke="#78350F" strokeWidth="2" strokeDasharray="3 3" />

      {/* Ambient Core Glow */}
      <circle cx="80" cy="110" r="55" fill={`url(#${id}-kandilGlow)`} />

      {/* Top Hanger Loop */}
      <circle cx="80" cy="40" r="5" stroke="#F59E0B" strokeWidth="2" fill="none" />

      {/* Main Lantern Star Frame - 3D Diamond Octahedron */}
      {/* Outer Diamond */}
      <polygon points="80,50 125,110 80,170 35,110" fill={`url(#${id}-kandilCrimson)`} stroke="#FBBF24" strokeWidth="2" />
      {/* Inner Facets */}
      <polygon points="80,50 102,110 80,170 58,110" fill={`url(#${id}-kandilGold)`} opacity="0.9" stroke="#FDE68A" strokeWidth="1" />
      <polygon points="80,50 80,170" stroke="#FEF3C7" strokeWidth="1.5" />
      <polygon points="35,110 125,110" stroke="#FEF3C7" strokeWidth="1.5" />

      {/* Corner Little Diya Lamps */}
      <circle cx="35" cy="110" r="4" fill="#FBBF24" />
      <circle cx="125" cy="110" r="4" fill="#FBBF24" />
      <circle cx="80" cy="50" r="4" fill="#FBBF24" />

      {/* Bottom Hanging Ribbon Tassels (Swaying Motion) */}
      <motion.g
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '80px 170px', transformBox: 'view-box' }}
      >
        {/* Tassel Strands */}
        <path d="M50 170 L45 280" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
        <path d="M60 170 L58 290" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
        <path d="M70 170 L70 300" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M80 170 L80 305" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M90 170 L90 300" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M100 170 L102 290" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
        <path d="M110 170 L115 280" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  );
}
