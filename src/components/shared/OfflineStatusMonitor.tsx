'use client';

import { useEffect, useState } from 'react';
import { JDGemCrush } from '../../game/JDGemCrush';

export function OfflineStatusMonitor() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-start p-4 pt-5 overflow-y-auto">
      <div className="absolute w-[350px] h-[350px] rounded-full top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40 animate-pulse"
        style={{ background: 'radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
        {/* Compact offline banner */}
        <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-2xl px-4 py-3 backdrop-blur-xl shadow-xl mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c8a96e]/5 border border-[#c8a96e]/15 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg" fill="none">
              <defs>
                <linearGradient id="s" x1="40" y1="40" x2="170" y2="340" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFF"/><stop offset="100%" stopColor="#BABABA"/>
                </linearGradient>
                <linearGradient id="g" x1="250" y1="20" x2="390" y2="380" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFF2C3"/><stop offset="50%" stopColor="#C99537"/><stop offset="100%" stopColor="#8C6120"/>
                </linearGradient>
              </defs>
              <path fill="url(#s)" d="M122 72C148 72 168 88 168 115L168 278C168 345 131 385 83 385C49 385 26 365 26 337C26 312 45 293 69 293C92 293 109 308 109 329C109 342 102 352 92 360C98 362 106 363 116 363C143 363 152 335 152 289L152 118C152 92 139 84 122 82Z"/>
              <path fill="url(#g)" d="M218 66L218 72L275 72C355 72 394 121 394 210C394 299 355 348 275 348L218 348L218 354L280 354C374 354 414 300 414 210C414 120 374 66 280 66Z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white">You&apos;re Offline</h1>
            <p className="text-white/30 text-[10px]">Auto-reconnecting in background</p>
          </div>
          <div className="flex items-center gap-1.5 text-[#c8a96e] animate-pulse flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8a96e]" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>

        <JDGemCrush />
      </div>
    </div>
  );
}
