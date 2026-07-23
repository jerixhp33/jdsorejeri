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

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} disabled={busy}
          className="text-white/40 text-xs hover:text-white transition-colors disabled:opacity-30">← Back</button>
        <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          <span className="text-xs font-bold text-white/80">
            SCORE
          </span>
          <span className="text-xl font-black">{score.toLocaleString()}</span>
        </div>
        <span className="text-[10px] text-white/30 ml-2">
          {levelNum === 'daily' ? 'Daily' : WORLDS[Math.floor(((levelNum as number) - 1) / 10)]?.name}
        </span>
        <button onClick={onToggleSound}
          className="text-sm w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-colors">
          {save.soundOn ? '🔊' : '🔇'}
        </button>
      </div>

      <Objectives objectives={objectives} />

      <div className="mb-2.5 p-2.5 rounded-2xl border border-white/[0.06]" style={{ background: 'linear-gradient(135deg, rgba(200,169,110,0.05), rgba(10,10,10,0.8))' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Score</p>
              <p className="text-white font-extrabold text-lg leading-none">{score.toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-end mb-1">
              <span className="text-xs font-bold text-white/80 tracking-widest uppercase">Target</span>
              <p className="text-lg font-extrabold leading-none text-white">{levelDef.target.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-center px-3 py-1 rounded-xl border border-white/[0.06]" style={{ background: moves <= 5 ? 'rgba(255,23,68,0.08)' : 'rgba(255,255,255,0.02)' }}>
            <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Moves</p>
            <p className={`font-extrabold text-lg leading-none ${moves <= 5 ? 'text-red-400' : 'text-white'}`}>{moves}</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.04]">
          <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out" style={{ 
            width: `${pct}%`, 
            background: pct >= 100 ? 'linear-gradient(90deg,#00f2fe,#4facfe)' : 'linear-gradient(90deg,#ff7eb3,#ff758c)',
            boxShadow: pct >= 100 ? '0 0 10px rgba(0,242,254,0.5)' : 'none'
          }} />
          <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 60%)' }} />
        </div>
        <div className="relative w-full h-0 mt-1">
          {[
            { p: (levelDef.target / levelDef.target) * 100, s: 1 },
            { p: (levelDef.star2 / levelDef.star3) * 100 > 100 ? 66 : (levelDef.star2 / levelDef.star3) * 100, s: 2 },
            { p: 100, s: 3 },
          ].map(({ p, s }) => (
            <div key={s} className="absolute -top-1 transition-all duration-500"
              style={{ left: `${Math.min(p, 100)}%`, transform: 'translateX(-50%)', opacity: earnedStars >= s ? 1 : 0.2, fontSize: 9 }}>
              ⭐
            </div>
          ))}
        </div>
      </div>

      {combo > 1 && (
        <div className="text-center mb-1.5 h-6">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full z-10 font-black text-xs text-white" 
            style={{ background: 'linear-gradient(90deg,#ff0844,#ffb199)', animation: 'gc-combo-bounce .3s ease-out', boxShadow: '0 0 16px rgba(255,8,68,0.4)' }}>
            COMBO x{combo}
          </div>
        </div>
      )}
      {combo <= 1 && <div className="h-6 mb-1.5" />}

      <div className="flex items-center justify-center gap-2 mb-2">
        {([
          { type: 'hammer' as BoosterType, emoji: '🔨', label: 'Hammer', count: save.boosters.hammer },
          { type: 'shuffle' as BoosterType, emoji: '🔀', label: 'Shuffle', count: save.boosters.shuffle },
          { type: 'extraMoves' as BoosterType, emoji: '➕', label: '+5 Moves', count: save.boosters.extraMoves },
        ]).map(b => (
          <button key={b.type} disabled={b.count <= 0 || (busy && b.type !== 'hammer') || result !== 'none'}
            onClick={() => onBoosterClick(b.type)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all disabled:opacity-30"
            style={{ 
              background: activeBooster === b.type ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
              color: activeBooster === b.type ? '#fff' : 'rgba(255,255,255,0.7)',
              borderColor: activeBooster === b.type ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)'
            }}>
            <span className="text-sm">{b.emoji}</span>
            <span>{b.count}</span>
          </button>
        ))}
      </div>

      {activeBooster === 'hammer' && (
        <div className="mt-2 text-center h-4">
          <span className="text-[10px] text-white font-semibold animate-pulse">🔨 Tap a gem to destroy it</span>
        </div>
      )}
    </>
  );
}
