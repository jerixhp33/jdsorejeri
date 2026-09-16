import React from 'react';

export function FloatingLotus({ className = "w-full h-full", id = 'lotus' }: { className?: string, id?: string }) {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-lotusPinkOuter`} x1="100" y1="180" x2="100" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C2785C" />
          <stop offset="60%" stopColor="#D4956B" />
          <stop offset="100%" stopColor="#E8C4A8" />
        </linearGradient>

        <linearGradient id={`${id}-lotusPinkInner`} x1="100" y1="170" x2="100" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B8704A" />
          <stop offset="70%" stopColor="#D4956B" />
          <stop offset="100%" stopColor="#FFF5EB" />
        </linearGradient>

        <linearGradient id={`${id}-lotusCore`} x1="100" y1="140" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>

      {/* Ripple Base */}
      <ellipse cx="100" cy="165" rx="75" ry="15" fill="#C2785C" opacity="0.15" />

      {/* Outer Petals */}
      <path d="M100 40 C130 90 165 140 160 160 C130 160 115 140 100 120 C85 140 70 160 40 160 C35 140 70 90 100 40 Z" fill={`url(#${id}-lotusPinkOuter)`} />
      
      {/* Side Petals Left & Right */}
      <path d="M40 130 C20 110 15 90 35 75 C60 90 80 120 100 140 C75 145 55 145 40 130 Z" fill={`url(#${id}-lotusPinkOuter)`} opacity="0.9" />
      <path d="M160 130 C180 110 185 90 165 75 C140 90 120 120 100 140 C125 145 145 145 160 130 Z" fill={`url(#${id}-lotusPinkOuter)`} opacity="0.9" />

      {/* Middle Petals */}
      <path d="M100 65 C120 105 145 140 140 155 C120 155 110 135 100 125 C90 135 80 155 60 155 C55 140 80 105 100 65 Z" fill={`url(#${id}-lotusPinkInner)`} />

      {/* Center Core */}
      <circle cx="100" cy="130" r="14" fill={`url(#${id}-lotusCore)`} />
      <circle cx="100" cy="130" r="7" fill="#FEF08A" />
    </svg>
  );
}
