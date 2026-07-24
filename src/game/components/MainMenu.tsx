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
    <>
      <style>{`
        @keyframes float-crystal {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); filter: drop-shadow(0 0 20px rgba(168,85,247,0.6)); }
          50% { transform: translateY(-20px) rotate(8deg) scale(1.05); filter: drop-shadow(0 0 45px rgba(168,85,247,1)); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes particle-float {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        
        .particles-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .particle {
          position: absolute;
          background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);
          border-radius: 50%;
          animation: particle-float linear infinite;
        }
      `}</style>

      <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Particles Background */}
        <div className="particles-container">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${(i * 4.1) % 100}%`,
                top: `${(i * 11.3) % 110 + 10}%`,
                width: `${(i % 3) * 2 + 3}px`,
                height: `${(i % 3) * 2 + 3}px`,
                animationDuration: `${(i % 5) + 6}s`,
                animationDelay: `${(i % 7) * 0.8}s`,
                opacity: 0.3 + (i % 4) * 0.15
              }}
            />
          ))}
        </div>

        <button 
          onClick={onSettings} 
          className="absolute top-6 right-6 z-20 w-12 h-12 flex items-center justify-center text-2xl bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl hover:bg-white/25 active:scale-95 transition-all shadow-lg animate-fade-in-up"
        >
          ⚙️
        </button>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-[360px] mx-auto text-center flex flex-col items-center">
          
          <div 
            className="text-[100px] mb-6 leading-none"
            style={{ animation: 'fade-in-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards, float-crystal 4s ease-in-out infinite' }}
          >
            💎
          </div>
          
          <h2
            className="text-4xl font-black mb-2 tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.7)] animate-fade-in-up delay-100"
          >
            JD GEM CRUSH
          </h2>
          <p className="text-white/70 text-sm tracking-[0.2em] uppercase font-bold animate-fade-in-up delay-200">
            Match · Crush · Conquer
          </p>
          <div className="mt-2 mb-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 animate-fade-in-up delay-200">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider">JD Store Offline</span>
          </div>

          <div className="w-full space-y-4 mb-8 animate-fade-in-up delay-300">
            {save.unlockedLevel > 1 && (
              <button
                onClick={onContinue}
                className="w-full py-4 rounded-2xl text-xl font-black text-white bg-gradient-to-r from-purple-500/40 to-blue-500/40 backdrop-blur-xl border border-white/30 hover:from-purple-500/60 hover:to-blue-500/60 active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                ▶ Continue Level {save.unlockedLevel}
              </button>
            )}
            <button 
              onClick={onPlay}
              className="w-full py-5 rounded-2xl text-2xl font-black text-purple-900 bg-white hover:bg-gray-100 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.6)] border border-white"
            >
              {totalStars > 0 ? '▶ LEVEL SELECT' : '▶ PLAY NEW GAME'}
            </button>
            
            <div className="flex gap-3">
              <button onClick={onStore} className="flex-1 py-4 bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all hover:bg-white/25 shadow-lg">
                <span className="text-3xl mb-2 drop-shadow-md">🛒</span>
                <span className="text-xs font-bold text-white tracking-widest uppercase">Store</span>
              </button>
              <button onClick={onStats} className="flex-1 py-4 bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all hover:bg-white/25 shadow-lg">
                <span className="text-3xl mb-2 drop-shadow-md">📊</span>
                <span className="text-xs font-bold text-white tracking-widest uppercase">Stats</span>
              </button>
              <button onClick={onDaily} className="flex-1 py-4 bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all hover:bg-white/25 shadow-lg">
                <span className="text-3xl mb-2 drop-shadow-md">📅</span>
                <span className="text-xs font-bold text-white tracking-widest uppercase">Daily</span>
              </button>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-3 mb-8 animate-fade-in-up delay-400">
            <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 shadow-lg flex flex-col items-center">
              <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">Stars</p>
              <p className="text-white font-black text-lg">{totalStars} ⭐</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 shadow-lg flex flex-col items-center">
              <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">Level</p>
              <p className="text-white font-black text-lg">{save.unlockedLevel}/{LEVELS.length}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 shadow-lg flex flex-col items-center">
              <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">Score</p>
              <p className="text-white font-black text-lg">{save.totalScore > 999 ? `${(save.totalScore / 1000).toFixed(1)}k` : save.totalScore}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-5 py-3 px-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 animate-fade-in-up delay-500 shadow-lg">
            <span className="text-[11px] text-white/60 uppercase font-bold tracking-widest">Boosters:</span>
            <span className="text-sm font-black text-white flex items-center gap-1">🔨 {save.boosters.hammer}</span>
            <span className="text-sm font-black text-white flex items-center gap-1">🔀 {save.boosters.shuffle}</span>
            <span className="text-sm font-black text-white flex items-center gap-1">➕ {save.boosters.extraMoves}</span>
          </div>
        </div>
      </div>
    </>
  );
}
