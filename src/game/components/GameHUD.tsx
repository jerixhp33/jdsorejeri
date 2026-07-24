import React from 'react';
import { SaveData, BoosterType } from '../engine/types';
import { LevelDef } from '../engine/types';
import { WORLDS } from '../data/worlds';
import { ObjectiveProgress } from '../engine/objectives';
import { Objectives } from './Objectives';

interface GameHUDProps {
  levelNum: number | 'daily';
  levelDef: LevelDef;
  save: SaveData;
  score: number;
  moves: number;
  combo: number;
  earnedStars: number;
  objectives: ObjectiveProgress[];
  activeBooster: BoosterType | null;
  busy: boolean;
  result: 'none' | 'win' | 'lose';
  onBoosterClick: (type: BoosterType) => void;
  onToggleSound: () => void;
  onBack: () => void;
}

export function GameHUD({
  levelNum, levelDef, save, score, moves, combo, earnedStars,
  objectives, activeBooster, busy, result, onBoosterClick, onToggleSound, onBack
}: GameHUDProps) {
  const pct = Math.min(100, (score / levelDef.target) * 100);
  const displayObjectives = objectives.filter(o => o.type !== 'score');

  return (
    <>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <button onClick={onBack} disabled={busy}
            className="text-white/60 hover:text-white transition-colors disabled:opacity-30 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold text-white tracking-wide leading-none">
              {levelNum === 'daily' ? 'Daily Challenge' : `Level ${levelNum}`}
            </span>
            <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">
              {levelNum === 'daily' ? 'Special Event' : WORLDS[Math.floor(((levelNum as number) - 1) / 10)]?.name || 'World'}
            </span>
          </div>
        </div>
        
        <button onClick={onToggleSound}
          className="text-base w-8 h-8 flex items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all shadow-sm">
          {save.soundOn ? '🔊' : '🔇'}
        </button>
      </div>

      {displayObjectives.length > 0 && <Objectives objectives={displayObjectives} />}

      <div className="mb-2 bg-white/10 backdrop-blur-xl border border-white/30 rounded-xl p-3 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/60 uppercase tracking-wider font-bold mb-0.5">Score</span>
            <span className="text-2xl font-black text-white leading-none">{score.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-white/60 uppercase tracking-wider font-bold mb-0.5">Target</span>
            <span className="text-xl font-bold text-white/90 leading-none">{levelDef.target.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/60 uppercase tracking-wider font-bold mb-0.5">Moves</span>
            <span className={`text-3xl font-black leading-none ${moves <= 5 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>{moves}</span>
          </div>
        </div>
        
        <div className="relative mt-2">
          <div className="w-full h-3 rounded-full bg-white/10 border border-white/10 overflow-hidden relative">
            <div className="h-full rounded-full transition-all duration-1000 ease-out relative" 
                 style={{ 
                   width: `${pct}%`, 
                   background: pct >= 100 ? 'linear-gradient(90deg,#00f2fe,#4facfe)' : 'linear-gradient(90deg,#ff7eb3,#ff758c)',
                   boxShadow: pct >= 100 ? '0 0 10px rgba(0,242,254,0.5)' : 'none'
                 }}>
                 <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
            </div>
          </div>
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {[
              { p: (levelDef.target / levelDef.target) * 100, s: 1 },
              { p: (levelDef.star2 / levelDef.star3) * 100 > 100 ? 66 : (levelDef.star2 / levelDef.star3) * 100, s: 2 },
              { p: 100, s: 3 },
            ].map(({ p, s }) => (
              <div key={s} className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
                style={{ 
                  left: `${Math.min(p, 100)}%`, 
                  transform: 'translate(-50%, -50%)', 
                  opacity: earnedStars >= s ? 1 : 0.4, 
                  fontSize: 14,
                  filter: earnedStars >= s ? 'drop-shadow(0 0 4px rgba(255,215,0,0.8))' : 'none'
                }}>
                ⭐
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-8 mb-2 flex justify-center items-center">
        {combo > 1 && (
          <div className="inline-block px-4 py-1 rounded-full font-black text-sm text-white" 
            style={{ 
              background: 'linear-gradient(90deg,#ff0844,#ffb199)', 
              animation: 'gc-combo-bounce .3s ease-out', 
              boxShadow: '0 4px 15px rgba(255,8,68,0.4)' 
            }}>
            COMBO x{combo}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mb-2">
        {([
          { type: 'hammer' as BoosterType, emoji: '🔨', label: 'Hammer', count: save.boosters.hammer },
          { type: 'shuffle' as BoosterType, emoji: '🔀', label: 'Shuffle', count: save.boosters.shuffle },
          { type: 'extraMoves' as BoosterType, emoji: '➕', label: '+5 Moves', count: save.boosters.extraMoves },
        ]).map(b => (
          <button key={b.type} disabled={b.count <= 0 || (busy && b.type !== 'hammer') || result !== 'none'}
            onClick={() => onBoosterClick(b.type)}
            className="relative flex items-center justify-center w-14 h-14 rounded-2xl border transition-all disabled:opacity-40 bg-white/10 backdrop-blur-md"
            style={{ 
              background: activeBooster === b.type ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
              borderColor: activeBooster === b.type ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
              boxShadow: activeBooster === b.type ? '0 0 20px rgba(255,255,255,0.3)' : '0 4px 10px rgba(0,0,0,0.1)'
            }}>
            <span className="text-2xl">{b.emoji}</span>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-black text-white shadow-lg"
                 style={{ 
                   background: b.count > 0 ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#475569',
                   borderColor: activeBooster === b.type ? '#fff' : 'rgba(255,255,255,0.5)'
                 }}>
              {b.count}
            </div>
          </button>
        ))}
      </div>

      {activeBooster === 'hammer' && (
        <div className="mt-3 text-center h-4 flex justify-center">
          <span className="text-xs text-white font-bold bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm animate-pulse border border-white/30 shadow-lg">
            🔨 Tap a gem to destroy it
          </span>
        </div>
      )}
    </>
  );
}
