import React from 'react';
import { SaveData, BoosterType } from '../engine/types';

interface StorePanelProps {
  save: SaveData;
  onSave: (s: SaveData) => void;
  onBack: () => void;
}

export function StorePanel({ save, onSave, onBack }: StorePanelProps) {
  const buy = (type: BoosterType, cost: number) => {
    if (save.coins >= cost) {
      onSave({
        ...save,
        coins: save.coins - cost,
        boosters: { ...save.boosters, [type]: save.boosters[type] + 1 }
      });
    }
  };

  return (
    <div className="w-full max-w-[360px] mx-auto pb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-white/50 text-sm hover:text-white transition-colors">← Back</button>
        <h2 className="text-xl font-black text-white tracking-wider">STORE</h2>
        <div className="px-3 py-1 rounded-full bg-black/40 border border-white/10 text-sm font-bold text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]">
          {save.coins || 0} 🪙
        </div>
      </div>

      <div className="space-y-4">
        {[
          { id: 'hammer' as BoosterType, name: 'Hammer', emoji: '🔨', desc: 'Destroy any single gem or obstacle layer.', cost: 50 },
          { id: 'shuffle' as BoosterType, name: 'Shuffle', emoji: '🔀', desc: 'Rearrange all gems on the board.', cost: 40 },
          { id: 'extraMoves' as BoosterType, name: '+5 Moves', emoji: '➕', desc: 'Add 5 extra moves to your level.', cost: 100 },
        ].map(b => (
          <div key={b.id} className="flex items-center p-4 rounded-2xl bg-white/[0.02] border border-white/10 gap-4">
            <div className="text-4xl">{b.emoji}</div>
            <div className="flex-1">
              <h3 className="font-bold text-white flex items-center gap-2">
                {b.name} <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full">Own: {save.boosters[b.id]}</span>
              </h3>
              <p className="text-[10px] text-white/40 mt-1 leading-tight">{b.desc}</p>
            </div>
            <button 
              onClick={() => buy(b.id, b.cost)}
              disabled={save.coins < b.cost}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all border disabled:opacity-30 disabled:border-white/10 disabled:bg-transparent"
              style={{
                background: save.coins >= b.cost ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,1))' : undefined,
                color: save.coins >= b.cost ? '#7928CA' : '#fff',
                borderColor: save.coins >= b.cost ? 'transparent' : undefined,
                boxShadow: save.coins >= b.cost ? '0 4px 15px rgba(255,255,255,0.3)' : undefined,
              }}
            >
              {b.cost} 🪙
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
