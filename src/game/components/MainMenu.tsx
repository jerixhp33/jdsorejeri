import React from 'react';
import { SaveData } from '../engine/types';
import { LEVELS } from '../data/levels';

interface MainMenuProps {
  save: SaveData;
  onPlay: () => void;
  onContinue: () => void;
  onStore: () => void;
  onStats: () => void;
  onDaily: () => void;
  onSettings: () => void;
}

export function MainMenu({ save, onPlay, onContinue, onStore, onStats, onDaily, onSettings }: MainMenuProps) {
  const totalStars = Object.values(save.levelStars).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full max-w-[360px] mx-auto text-center flex flex-col items-center justify-center min-h-[500px] relative">
      <button onClick={onSettings} className="absolute top-0 right-0 w-10 h-10 flex items-center justify-center text-xl bg-white/5 rounded-full hover:bg-white/10 transition-colors">
        ⚙️
      </button>

      <div className="text-5xl mb-3">💎</div>
      <h2
        className="text-2xl font-black mb-1 tracking-tight"
        style={{
          background: 'linear-gradient(90deg, #fff, #e0e0e0, #fff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}
      >
        JD GEM CRUSH
      </h2>
      <p className="text-white/30 text-xs mb-6">Match · Crush · Conquer</p>

      <div className="space-y-2.5 mb-6">
        {save.unlockedLevel > 1 && (
          <button
            onClick={onContinue}
            className="w-48 py-4 rounded-full text-xl font-black text-[#7928CA] bg-white/90 backdrop-blur-md active:scale-95 transition-transform relative overflow-hidden group shadow-[0_0_30px_rgba(255,255,255,0.4)]"
          >
            ▶ Continue Level {save.unlockedLevel}
          </button>
        )}
        <button onClick={onPlay}
          className="w-full py-3 rounded-full text-sm font-bold text-white bg-white/20 backdrop-blur-md border border-white/40 hover:bg-white/30 active:scale-95 transition-all shadow-lg"
        >
          {totalStars > 0 ? '▶ Level Select' : '▶ Play New Game'}
        </button>
        <button onClick={onDaily}
          className="w-full py-3 rounded-2xl text-sm font-bold border border-white/10 text-white bg-gradient-to-r from-purple-900/40 to-blue-900/40 hover:from-purple-900/60 hover:to-blue-900/60 active:scale-95 transition-all mb-2 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
        >
          📅 Daily Challenge
        </button>
        <div className="flex gap-2">
          <button onClick={onStore} className="flex-1 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all hover:bg-white/20">
            <span className="text-2xl mb-1 drop-shadow-md">🛒</span>
            <span className="text-xs font-bold text-white tracking-widest uppercase opacity-90">Store</span>
          </button>
          <button onClick={onStats} className="flex-1 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all hover:bg-white/20">
            <span className="text-2xl mb-1 drop-shadow-md">📊</span>
            <span className="text-xs font-bold text-white tracking-widest uppercase opacity-90">Stats</span>
          </button>
          <button onClick={onDaily} className="flex-1 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all hover:bg-white/20">
            <span className="text-2xl mb-1 drop-shadow-md">📅</span>
            <span className="text-xs font-bold text-white tracking-widest uppercase opacity-90">Daily</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <p className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Stars</p>
          <p className="text-white font-bold text-sm">{totalStars} ⭐</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <p className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Level</p>
          <p className="text-white font-bold text-sm">{save.unlockedLevel}/{LEVELS.length}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <p className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Score</p>
          <p className="text-white font-bold text-sm">{save.totalScore > 999 ? `${(save.totalScore / 1000).toFixed(1)}k` : save.totalScore}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-2">
        <span className="text-[10px] text-white/20">Boosters:</span>
        <span className="text-xs text-white/50">🔨{save.boosters.hammer}</span>
        <span className="text-xs text-white/50">🔀{save.boosters.shuffle}</span>
        <span className="text-xs text-white/50">➕{save.boosters.extraMoves}</span>
      </div>
    </div>
  );
}
