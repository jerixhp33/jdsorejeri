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
    <div className="w-full flex-1 flex flex-col mx-auto rounded-2xl overflow-hidden border border-white/10 relative">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto w-10 h-10 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/25 transition-all shadow-lg">
          ←
        </button>
        <div className="flex items-center gap-2">
          <div className="pointer-events-auto px-4 py-2 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 flex items-center gap-2 shadow-lg">
            <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Stars</span>
            <span className="text-sm font-black text-white">{totalStars} / {LEVELS.length * 3} ⭐</span>
          </div>
          <div className="pointer-events-auto px-4 py-2 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 flex items-center gap-2 shadow-lg">
            <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Coins</span>
            <span className="text-sm font-black text-yellow-400">{save.coins || 0} 🪙</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth hide-scrollbar p-6 pt-24 pb-32">
        {/* Winding path SVG background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
           <svg width="100%" height="100%" preserveAspectRatio="none">
              <path d="M 50,0 Q 300,500 50,1000 T 50,2000 T 50,3000 T 50,4000 T 50,5000" stroke="rgba(255,255,255,0.8)" strokeWidth="4" strokeDasharray="15 15" fill="none" />
           </svg>
        </div>

        <div className="flex flex-col-reverse gap-8 relative z-10">
          {WORLDS.map((world, wi) => {
            const levelsInWorld = Array.from({ length: world.range[1] - world.range[0] + 1 }, (_, i) => world.range[0] + i);
            return (
              <div key={wi} className="relative mb-8">
                <div className="sticky top-20 z-30 text-center mb-10">
                   <span className="inline-block px-5 py-2 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 text-sm font-black tracking-widest text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                     {world.emoji} {world.name.toUpperCase()}
                   </span>
                </div>
                
                <div className="flex flex-col-reverse gap-8 items-center">
                  {levelsInWorld.map((lvlIdx, idx) => {
                    const lvl = lvlIdx + 1;
                    const unlocked = lvl <= save.unlockedLevel;
                    const stars = save.levelStars[lvl] || 0;
                    const isLatest = lvl === save.unlockedLevel;
                    // Alternating snake pattern
                    const offset = Math.sin((idx * Math.PI) / 3) * 80;
                    
                    const isCompleted = stars > 0;

                    return (
                      <div key={lvl} 
                           className={`relative flex items-center justify-center transition-all ${isLatest ? 'level-active' : ''}`}
                           style={{ transform: `translateX(${offset}px)` }}>
                        
                        {isLatest && (
                          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-60"></div>
                        )}

                        <button
                          onClick={() => unlocked && onSelect(lvl)}
                          disabled={!unlocked}
                          className={`
                            ${unlocked ? 'w-16 h-16' : 'w-12 h-12'} 
                            rounded-full flex flex-col items-center justify-center transition-all relative z-10
                            ${!unlocked ? 'bg-black/40 border border-white/10 backdrop-blur-md cursor-not-allowed' : 
                              isCompleted ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] cursor-pointer' : 
                              'bg-white/30 backdrop-blur-md border-2 border-white text-white shadow-xl cursor-pointer'}
                          `}
                        >
                          {unlocked ? (
                            <span className={`font-black text-2xl leading-none ${isCompleted ? 'text-[#7928CA]' : 'text-white'}`}>
                              {lvl}
                            </span>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                          )}
                        </button>
                        
                        {unlocked && (
                          <div className="absolute -bottom-3 flex gap-0.5 bg-white/15 px-2 py-0.5 rounded-full border border-white/30 backdrop-blur-xl shadow-lg z-20">
                            {[1, 2, 3].map(s => (
                              <span key={s} style={{ fontSize: 10, filter: stars >= s ? 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' : 'none', opacity: stars >= s ? 1 : 0.4 }}>⭐</span>
                            ))}
                          </div>
                        )}

                        {isLatest && (
                          <div className="absolute -top-10 text-3xl animate-bounce z-20 drop-shadow-lg">
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
