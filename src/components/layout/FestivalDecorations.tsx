'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useFestival } from '@/components/providers/FestivalProvider';

const DiwaliDecorations = () => {
  const diyas = Array.from({ length: 7 });
  return (
    <div className="fixed top-16 left-0 right-0 flex justify-between px-4 sm:px-12 pointer-events-none z-[40]">
      {diyas.map((_, i) => (
        <div key={i} className="relative w-8 h-8 opacity-80" style={{ animationDelay: `${i * 0.2}s` }}>
          {/* Flame */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-4 bg-orange-400 rounded-full blur-[1px] shadow-[0_0_8px_4px_rgba(255,165,0,0.6)] animate-pulse" />
          <svg viewBox="0 0 24 24" fill="#8f3d3d" className="w-full h-full drop-shadow-md">
            <path d="M12 22c5.523 0 10-4.477 10-10H2c0 5.523 4.477 10 10 10z" />
          </svg>
        </div>
      ))}
    </div>
  );
};

const ChristmasDecorations = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[40] overflow-hidden">
      {/* Bottom left frost */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.15),transparent_70%)] blur-md" />
      {/* Bottom right frost */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.15),transparent_70%)] blur-md" />
      
      {/* Some static snowflakes */}
      <svg className="absolute top-20 left-10 w-8 h-8 text-white/30" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L13 7H11L12 2ZM19 5L16 9.5L14 8L19 5ZM5 5L10 8L8 9.5L5 5ZM22 12L17 11V13L22 12ZM2 12L7 13V11L2 12ZM19 19L14 16L16 14.5L19 19ZM5 19L8 14.5L10 16L5 19ZM12 22L11 17H13L12 22Z" />
      </svg>
      <svg className="absolute top-40 right-20 w-6 h-6 text-white/20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L13 7H11L12 2ZM19 5L16 9.5L14 8L19 5ZM5 5L10 8L8 9.5L5 5ZM22 12L17 11V13L22 12ZM2 12L7 13V11L2 12ZM19 19L14 16L16 14.5L19 19ZM5 19L8 14.5L10 16L5 19ZM12 22L11 17H13L12 22Z" />
      </svg>
    </div>
  );
};

const NewYearDecorations = () => {
  const dots = Array.from({ length: 40 });
  return (
    <div className="fixed top-0 left-0 right-0 flex justify-between px-2 pointer-events-none z-[100]">
      {dots.map((_, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping"
          style={{ animationDuration: '3s', animationDelay: `${Math.random() * 3}s` }}
        />
      ))}
    </div>
  );
};

const HalloweenDecorations = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-48 pointer-events-none z-[40]">
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent animate-pulse" style={{ animationDuration: '6s' }} />
    </div>
  );
};

export function FestivalDecorations() {
  return null;
}
