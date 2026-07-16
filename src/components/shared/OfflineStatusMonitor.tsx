'use client';

import { useEffect, useState } from 'react';

function ReactCatcherGame() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [catcherX, setCatcherX] = useState(180);
  const [items, setItems] = useState<{ id: number; x: number; y: number; type: string; speed: number }[]>([]);
  const boardWidth = 360;
  const boardHeight = 180;

  useEffect(() => {
    const saved = localStorage.getItem('jd_offline_catcher_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setCatcherX(Math.max(32, Math.min(rect.width - 32, x)));
  };

  useEffect(() => {
    let spawnTimer = 0;
    let itemId = 0;
    let frameId: number;

    const update = () => {
      // Spawn items
      spawnTimer += 16;
      if (spawnTimer > 1200) {
        const types = ['gem', 'gem', 'earring', 'poster', 'bomb'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Math.max(10, Math.floor(Math.random() * (boardWidth - 20)));
        const speed = 1.5 + Math.random() * 1.5 + (score * 0.05);
        
        setItems(prev => [...prev, { id: itemId++, x, y: -20, type, speed }]);
        spawnTimer = 0;
      }

      // Move items & check collisions
      setItems(prev => {
        const remaining: typeof prev = [];
        const catcherY = boardHeight - 18;

        prev.forEach(item => {
          const nextY = item.y + item.speed;

          if (nextY >= catcherY && nextY <= catcherY + 12) {
            const cLeft = catcherX - 32;
            const cRight = catcherX + 32;
            const itemWidth = item.type === 'poster' ? 12 : 16;

            if (item.x >= cLeft - itemWidth && item.x <= cRight) {
              let points = 0;
              if (item.type === 'gem') points = 1;
              else if (item.type === 'earring') points = 3;
              else if (item.type === 'poster') points = 5;
              else if (item.type === 'bomb') points = -5;

              setScore(s => {
                const ns = Math.max(0, s + points);
                if (ns > highScore) {
                  setHighScore(ns);
                  localStorage.setItem('jd_offline_catcher_highscore', String(ns));
                }
                return ns;
              });
              return;
            }
          }

          if (nextY <= boardHeight + 10) {
            remaining.push({ ...item, y: nextY });
          }
        });

        return remaining;
      });

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [catcherX, score, highScore]);

  return (
    <div className="w-full bg-white/[0.01] border border-white/[0.05] rounded-[24px] p-5 relative select-none">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#c8a96e]">✦ Luxe Collector ✦</span>
        <div className="flex gap-3 text-xs text-foreground/">
          <span>Score: <strong className="text-foreground">{score}</strong></span>
          <span>High Score: <strong className="text-foreground">{highScore}</strong></span>
        </div>
      </div>

      <div 
        className="h-[180px] w-full bg-black/25 border border-foreground/ rounded-2xl overflow-hidden relative cursor-pointer touch-none"
        onPointerMove={handlePointerMove}
      >
        {/* Catcher */}
        <div 
          className="absolute bottom-2 h-2.5 rounded-full border border-foreground/ shadow-lg"
          style={{
            left: catcherX,
            width: '64px',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(90deg, #8c6120, #e9c86e, #8c6120)'
          }}
        />

        {/* Falling items */}
        {items.map(item => {
          let itemClass = '';
          if (item.type === 'gem') itemClass = 'w-3.5 h-3.5 bg-gradient-to-br from-white to-[#c8a96e] [clip-path:polygon(50%_0%,100%_38%,82%_100%,18%_100%,0%_38%)] shadow-md';
          else if (item.type === 'earring') itemClass = 'w-4 h-4 border-2 border-[#c8a96e] rounded-full flex items-center justify-center after:content-["✦"] after:text-[7px] after:text-[#c8a96e] shadow-sm';
          else if (item.type === 'poster') itemClass = 'w-3 h-4.5 bg-gradient-to-br from-neutral-200 to-white rounded-[1px] border border-black/20 shadow-md';
          else if (item.type === 'bomb') itemClass = 'w-3 h-3 bg-red-500 rounded-[2px] shadow-[0_0_10px_rgba(239,68,68,0.6)]';

          return (
            <div
              key={item.id}
              className={`absolute ${itemClass}`}
              style={{
                left: item.x,
                top: item.y,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function OfflineStatusMonitor() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check current online state
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center p-5 overflow-y-auto">
      {/* Ambient Glow */}
      <div 
        className="absolute w-[300px] h-[300px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(200, 169, 110, 0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[440px] text-center flex flex-col items-center">
        {/* Official JD Logo */}
        <div className="mb-6 flex items-center justify-center w-20 h-20 rounded-3xl bg-[#c8a96e]/5 border border-[#c8a96e]/15 shadow-2xl">
          <svg width="54" height="54" viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg" fill="none">
            <defs>
              <linearGradient id="mon-silver" x1="40" y1="40" x2="170" y2="340" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#F3F3F3" />
                <stop offset="75%" stopColor="#DADADA" />
                <stop offset="100%" stopColor="#BABABA" />
              </linearGradient>
              <linearGradient id="mon-gold" x1="250" y1="20" x2="390" y2="380" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFF2C3" />
                <stop offset="18%" stopColor="#E9C86E" />
                <stop offset="38%" stopColor="#C99537" />
                <stop offset="55%" stopColor="#B98128" />
                <stop offset="80%" stopColor="#E0B85A" />
                <stop offset="100%" stopColor="#8C6120" />
              </linearGradient>
            </defs>
            <path fill="url(#mon-silver)" d="M122 72 C148 72 168 88 168 115 L168 278 C168 345 131 385 83 385 C49 385 26 365 26 337 C26 312 45 293 69 293 C92 293 109 308 109 329 C109 342 102 352 92 360 C98 362 106 363 116 363 C143 363 152 335 152 289 L152 118 C152 92 139 84 122 82 Z"/>
            <rect x="122" y="66" width="70" height="6" rx="3" fill="url(#mon-silver)"/>
            <path fill="url(#mon-gold)" d="M218 66 L218 72 L275 72 C355 72 394 121 394 210 C394 299 355 348 275 348 L218 348 L218 354 L280 354 C374 354 414 300 414 210 C414 120 374 66 280 66 Z"/>
            <rect x="218" y="66" width="58" height="4" fill="url(#mon-gold)"/>
            <rect x="218" y="350" width="58" height="4" fill="url(#mon-gold)"/>
          </svg>
        </div>

        {/* Status card */}
        <div className="w-full bg-white/[0.02] border border-white/[0.08] rounded-[24px] p-8 backdrop-blur-xl shadow-2xl mb-5">
          <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-semibold tracking-wider uppercase mb-5">
            Connection Lost
          </span>
          <h1 className="font-display text-2.5xl font-bold tracking-tight text-foreground mb-3">
            You&apos;re Offline
          </h1>
          <p className="text-foreground/ text-sm leading-relaxed mb-6">
            Your connection has been lost. We will automatically return you to the store the instant your connection is restored.
          </p>
          <div className="flex items-center justify-center gap-2 text-[#c8a96e] text-xs font-semibold uppercase tracking-widest animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#c8a96e]" />
            Reconnecting...
          </div>
        </div>

        {/* Luxe Collector interactive arcade game */}
        <ReactCatcherGame />

        <div className="text-foreground/ text-xs mt-6 leading-relaxed">
          Need support? Contact us on WhatsApp at<br />
          <a href="https://wa.me/919360490974" target="_blank" rel="noopener noreferrer" className="text-[#c8a96e] font-medium hover:underline">
            +91 9360490974
          </a>
        </div>
      </div>
    </div>
  );
}
