import React from 'react';

export function SolidDiwaliRangoli({ className = "w-full h-full", id = 'rangoli' }: { className?: string, id?: string }) {
  return (
    <svg 
      viewBox="0 0 600 600" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <radialGradient id={`${id}-rangoliCenter`} cx="300" cy="300" r="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.4" />
          <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.25" />
          <stop offset="70%" stopColor="#D97706" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#78350F" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`${id}-petalSaffron`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Radial Background Tone */}
      <circle cx="300" cy="300" r="280" fill={`url(#${id}-rangoliCenter)`} />

      {/* Outer Decorative Ring */}
      <circle cx="300" cy="300" r="260" stroke="#B45309" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" />
      <circle cx="300" cy="300" r="250" stroke="#F59E0B" strokeWidth="1.5" opacity="0.6" />
      <circle cx="300" cy="300" r="240" stroke="#D97706" strokeWidth="3" opacity="0.5" />

      {/* 16 Radial Petals Layer (Outer) */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 360) / 16;
        return (
          <g key={`outer-${i}`} transform={`rotate(${angle} 300 300)`}>
            <path 
              d="M300 50 C315 110 330 160 300 200 C270 160 285 110 300 50 Z" 
              fill={`url(#${id}-petalSaffron)`} 
              opacity="0.3"
            />
            <circle cx="300" cy="65" r="5" fill="#B45309" opacity="0.6" />
          </g>
        );
      })}

      {/* Middle Decorative Ring */}
      <circle cx="300" cy="300" r="190" stroke="#FBBF24" strokeWidth="2" opacity="0.7" />
      <circle cx="300" cy="300" r="180" stroke="#B45309" strokeWidth="4" opacity="0.5" />

      {/* 12 Inner Lotus Petals Layer */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 360) / 12;
        return (
          <g key={`inner-${i}`} transform={`rotate(${angle} 300 300)`}>
            <path 
              d="M300 120 C320 170 335 220 300 250 C265 220 280 170 300 120 Z" 
              fill="#D97706" 
              opacity="0.45"
            />
            <path 
              d="M300 135 C312 175 322 210 300 235 C278 210 288 175 300 135 Z" 
              fill="#FBBF24" 
              opacity="0.6"
            />
            <circle cx="300" cy="130" r="4" fill="#78350F" />
          </g>
        );
      })}

      {/* Radial Diya Flame Accents (8 Points) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8 + 22.5;
        return (
          <g key={`flame-${i}`} transform={`rotate(${angle} 300 300)`}>
            <path 
              d="M300 100 Q310 115 300 130 Q290 115 300 100 Z" 
              fill="#F59E0B" 
              opacity="0.8" 
            />
          </g>
        );
      })}

      {/* Inner Core Rings */}
      <circle cx="300" cy="300" r="110" stroke="#D97706" strokeWidth="2" opacity="0.8" />
      <circle cx="300" cy="300" r="100" fill="#78350F" opacity="0.15" />
      <circle cx="300" cy="300" r="90" stroke="#FBBF24" strokeWidth="3" opacity="0.6" />
      
      {/* Central Star/Flower Center */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8;
        return (
          <g key={`core-${i}`} transform={`rotate(${angle} 300 300)`}>
            <path 
              d="M300 210 Q310 250 300 290 Q290 250 300 210 Z" 
              fill="#F59E0B" 
              opacity="0.7" 
            />
          </g>
        );
      })}

      <circle cx="300" cy="300" r="40" fill="#D97706" opacity="0.5" />
      <circle cx="300" cy="300" r="25" fill="#FBBF24" opacity="0.8" />
      <circle cx="300" cy="300" r="10" fill="#78350F" opacity="0.9" />
    </svg>
  );
}
