import React from 'react';
import { SaveData } from '../engine/types';
import { LEVELS } from '../data/levels';
import { WORLDS } from '../data/worlds';

interface LevelSelectProps {
  save: SaveData;
  onSelect: (lvl: number) => void;
  onBack: () => void;
}

export function LevelSelect({ save, onSelect, onBack }: LevelSelectProps) {
  return (
    <div className="w-full max-w-[440px] mx-auto pb-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-white/50 text-sm hover:text-white transition-colors flex items-center gap-1">
          ← Menu
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Total Stars</span>
          <span className="text-sm font-bold text-white">
            {Object.values(save.levelStars).reduce((a, b) => a + b, 0)} / {LEVELS.length * 3} ⭐
          </span>
        </div>
      </div>

      {WORLDS.map((world, wi) => (
        <div key={wi} className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{world.emoji}</span>
            <span className="text-sm font-bold text-white/80">{world.name}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: world.range[1] - world.range[0] + 1 }, (_, i) => {
              const lvl = world.range[0] + i + 1;
              const unlocked = lvl <= save.unlockedLevel;
              const stars = save.levelStars[lvl] || 0;
              return (
                <button
                  key={lvl}
                  onClick={() => unlocked && onSelect(lvl)}
                  disabled={!unlocked}
                  className="relative flex flex-col items-center justify-center rounded-xl border transition-all"
                  style={{
                    aspectRatio: '1',
                    background: unlocked
                      ? stars === 3 ? 'linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))'
                      : 'rgba(255,255,255,0.03)'
                      : 'rgba(255,255,255,0.01)',
                    borderColor: unlocked
                      ? stars > 0 ? 'rgba(200,169,110,0.3)' : 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    opacity: unlocked ? 1 : 0.35,
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                  }}
                >
                  {unlocked ? (
                    <>
                      <span className="text-white font-bold text-base leading-none">{lvl}</span>
                      <div className="flex gap-px mt-1">
                        {[1, 2, 3].map(s => (
                          <span key={s} style={{ fontSize: 8, opacity: stars >= s ? 1 : 0.2 }}>⭐</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="text-white/20 text-lg">🔒</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
