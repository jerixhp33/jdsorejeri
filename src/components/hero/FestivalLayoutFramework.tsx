'use client';

import React from 'react';
import { getFestivalTheme } from '@/lib/festival-config';
import { DiwaliDecorations } from './DiwaliDecorations';
import { VinayagarDecorations } from './VinayagarDecorations';

interface FestivalLayoutFrameworkProps {
  festivalType?: string;
  isFestivalEnabled: boolean;
  children: React.ReactNode;
}

export function FestivalLayoutFramework({
  festivalType,
  isFestivalEnabled,
  children,
}: FestivalLayoutFrameworkProps) {
  if (!isFestivalEnabled) {
    return <div className="relative w-full pb-4 lg:pb-8">{children}</div>;
  }

  const theme = getFestivalTheme(festivalType);

  return (
    <div className="relative w-full pb-6 lg:pb-12 -mt-24 pt-24 sm:-mt-28 sm:pt-28 md:-mt-32 md:pt-32 overflow-hidden">
      {/* Slot 0: Ambient Background Gradient & Glow (Fades seamlessly to dark store black at bottom) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(to bottom, ${theme.gradientFrom} 0%, ${theme.gradientVia} 50%, #0F0906 80%, transparent 100%)` 
          }}
        />
        <div 
          className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[120%] pointer-events-none"
          style={{ 
            background: `radial-gradient(ellipse at center, ${theme.radialGlow} 0%, rgba(0,0,0,0) 65%)` 
          }}
        />

        {/* Festive Layer (Toran, Diyas, Lanterns, Rangoli) */}
        {festivalType === 'vinayagar_chaturthi' ? <VinayagarDecorations /> : <DiwaliDecorations />}
      </div>

      {/* Structured Content Slots (Navbar Space -> Toran Clearance -> Hero Banner -> Best Sellers) */}
      <div className="relative z-10 w-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
