import React from 'react';
import { ObjectiveProgress } from '../engine/objectives';
import { GemVisual } from './GemVisual';

export function Objectives({ objectives }: { objectives: ObjectiveProgress[] }) {
  if (!objectives || objectives.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
      {objectives.map((obj, i) => {
        const isComplete = obj.completed;
        const pct = Math.min(100, (obj.currentAmount / obj.targetAmount) * 100);

        let icon: React.ReactNode = '🎯';
        if (obj.type === 'collect' && obj.color !== undefined) {
          icon = (
            <div className="w-5 h-5 flex items-center justify-center">
              <GemVisual 
                cell={{ id: 0, color: obj.color, special: 'none', matched: false }} 
                size={22} 
                colorBlind={true}
              />
            </div>
          );
        } else if (obj.type === 'clear_obstacle') {
          if (obj.obstacleType === 'ice') icon = '🧊';
          if (obj.obstacleType === 'chain') icon = '⛓️';
          if (obj.obstacleType === 'crate') icon = '📦';
        }

        return (
          <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-300 ${
            isComplete ? 'bg-white/30 border-white/50' : 'bg-white/10 border-white/20'
          }`}>
            <div className={`flex items-center justify-center leading-none ${isComplete ? 'animate-bounce text-lg' : ''}`} style={{
              textShadow: obj.type === 'collect' ? '0 1px 3px rgba(0,0,0,0.5)' : 'none'
            }}>
              {isComplete ? '✅' : icon}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider leading-none">
                {obj.type === 'score' ? 'Score' : obj.type === 'collect' ? 'Collect' : 'Clear'}
              </span>
              <span className="text-sm font-extrabold text-white leading-none">
                {isComplete ? 'Done' : `${obj.currentAmount}/${obj.targetAmount}`}
              </span>
            </div>
            
            {!isComplete && (
              <div className="absolute bottom-0 left-0 h-[2px] bg-white rounded-full transition-all duration-300" 
                   style={{ width: `${pct}%` }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
