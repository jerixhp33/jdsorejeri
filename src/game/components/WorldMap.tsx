import React, { useEffect, useRef } from 'react';
import { SaveData } from '../engine/types';
import { LEVELS } from '../data/levels';
import { WORLDS } from '../data/worlds';

interface WorldMapProps {
  save: SaveData;
  onSelect: (lvl: number) => void;
  onBack: () => void;
}

export function WorldMap({ save, onSelect, onBack }: WorldMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the latest unlocked level on mount
    if (scrollRef.current) {
      const activeNode = scrollRef.current.querySelector('.level-active');
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  const totalStars = Object.values(save.levelStars).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full h-[650px] max-h-[85vh] mx-auto flex flex-col rounded-2xl overflow-hidden border border-white/10 relative"
      style={{ background: '#0a0a0a' }}>
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all">
          ←
        </button>
        <div className="flex items-center gap-2">
          <div className="pointer-events-auto px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Stars</span>
            <span className="text-sm font-black text-white/90">{totalStars} / {LEVELS.length * 3} ⭐</span>
          </div>
          <div className="pointer-events-auto px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Coins</span>
            <span className="text-sm font-black text-yellow-400">{save.coins || 0} 🪙</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth hide-scrollbar p-6 pt-24 pb-32">
        {/* Winding path SVG background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
           <svg width="100%" height="100%" preserveAspectRatio="none">
              <path d="M 50,0 Q 300,500 50,1000 T 50,2000 T 50,3000 T 50,4000 T 50,5000" stroke="rgba(255,255,255,0.4)" strokeWidth="6" strokeDasharray="15 15" fill="none" />
           </svg>
        </div>

        <div className="flex flex-col-reverse gap-8 relative z-10">
          {WORLDS.map((world, wi) => {
            const levelsInWorld = Array.from({ length: world.range[1] - world.range[0] + 1 }, (_, i) => world.range[0] + i);
            return (
              <div key={wi} className="relative mb-8">
                <div className="sticky top-20 z-30 text-center mb-6">
                   <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 text-xs font-black tracking-widest text-white shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                     {world.emoji} {world.name.toUpperCase()}
                   </span>
                </div>
                
                <div className="flex flex-col-reverse gap-4 items-center">
                  {levelsInWorld.map((lvlIdx, idx) => {
                    const lvl = lvlIdx + 1;
                    const unlocked = lvl <= save.unlockedLevel;
                    const stars = save.levelStars[lvl] || 0;
                    const isLatest = lvl === save.unlockedLevel;
                    // Alternating snake pattern
                    const offset = Math.sin((idx * Math.PI) / 3) * 80;

                    return (
                      <div key={lvl} 
                           className={`relative flex items-center justify-center transition-all ${isLatest ? 'level-active transform scale-110' : ''}`}
                           style={{ transform: `translateX(${offset}px)` }}>
                        
                        <button
                          onClick={() => unlocked && onSelect(lvl)}
                          disabled={!unlocked}
                          className="w-14 h-14 rounded-full border-[3px] flex flex-col items-center justify-center transition-all shadow-xl backdrop-blur-sm"
                          style={{
                            background: !unlocked ? 'rgba(0,0,0,0.4)' 
                              : stars > 0 ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,1))' : 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.8))',
                            borderColor: unlocked ? 'rgba(255,255,255,0.8)' : '#333',
                            boxShadow: !unlocked ? 'none' : stars > 0 ? '0 0 20px rgba(255,255,255,0.8)' : '0 4px 10px rgba(0,0,0,0.3)',
                            opacity: unlocked ? 1 : 0.5,
                            cursor: unlocked ? 'pointer' : 'not-allowed',
                            color: !unlocked ? 'rgba(255,255,255,0.2)' : stars > 0 ? '#7928CA' : '#333'
                          }}
                        >
                          {unlocked ? (
                            <>
                              <span className={`font-black text-lg leading-none ${stars > 0 ? 'text-[#7928CA]' : 'text-black'}`}>
                                {lvl}
                              </span>
                            </>
                          ) : (
                            <span className="text-white/30 text-lg">🔒</span>
                          )}
                        </button>
                        
                        {unlocked && (
                          <div className="absolute -bottom-2 flex gap-0.5 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
                            {[1, 2, 3].map(s => (
                              <span key={s} style={{ fontSize: 9, opacity: stars >= s ? 1 : 0.2 }}>⭐</span>
                            ))}
                          </div>
                        )}

                        {isLatest && (
                          <div className="absolute -top-6 text-2xl animate-bounce">
                            👇
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
