import React from 'react';
import { SaveData } from '../engine/types';
import { LEVELS } from '../data/levels';

interface StatsPanelProps {
  save: SaveData;
  onBack: () => void;
}

export function StatsPanel({ save, onBack }: StatsPanelProps) {
  const totalStars = Object.values(save.levelStars).reduce((a, b) => a + b, 0);
  const maxStars = LEVELS.length * 3;
  const progress = Math.min(100, (save.unlockedLevel / LEVELS.length) * 100);

  const stats = [
    { label: 'Gems Crushed', value: save.stats?.gemsDestroyed?.toLocaleString() || '0', icon: '💎' },
    { label: 'Obstacles Cleared', value: save.stats?.obstaclesCleared?.toLocaleString() || '0', icon: '💥' },
    { label: 'Levels Played', value: save.stats?.levelsPlayed?.toLocaleString() || '0', icon: '🎮' },
    { label: 'Total Score', value: save.totalScore.toLocaleString(), icon: '🏆' },
    { label: 'Total Stars', value: `${totalStars}/${maxStars}`, icon: '⭐' },
    { label: 'Total Coins', value: save.coins?.toLocaleString() || '0', icon: '🪙' },
  ];

  return (
    <div className="w-full max-w-[360px] mx-auto pb-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="text-white/50 text-sm hover:text-white transition-colors">← Back</button>
        <h2 className="text-xl font-black text-white tracking-wider">STATS</h2>
        <div className="w-10"></div>
      </div>

      <div className="p-5 rounded-2xl border border-white/10 mb-6 relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, rgba(200,169,110,0.1), rgba(10,10,10,0.8))' }}>
        <h3 className="text-xs text-white/50 font-bold uppercase tracking-widest mb-2">Campaign Progress</h3>
        <div className="flex items-end justify-between mb-3">
          <span className="text-3xl font-black text-white drop-shadow-md">{Math.floor(progress)}%</span>
          <span className="text-sm font-bold text-white/70">Level {save.unlockedLevel}/{LEVELS.length}</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
            <span className="text-2xl mb-2">{s.icon}</span>
            <span className="text-lg font-black text-white mb-1 leading-none">{s.value}</span>
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
