import React, { useRef, useCallback, useState } from 'react';
import { Cell, Pos, BoosterType } from '../engine/types';
import { COLS, ROWS } from '../engine/constants';
import { GemVisual } from './GemVisual';
import { inBounds } from '../engine/grid';
import { Obstacle } from '../engine/obstacles';

interface GameBoardProps {
  grid: Cell[][];
  sel: Pos | null;
  busy: boolean;
  result: 'none' | 'win' | 'lose';
  matchedSet: Set<string>;
  shaking: string | null;
  flashRows: Set<number>;
  flashCols: Set<number>;
  activeBooster: BoosterType | null;
  obstacles: Obstacle[];
  colorBlind: boolean;
  onTapCell: (r: number, c: number) => void;
  onSwap: (a: Pos, b: Pos) => void;
  floats: { id: number; x: number; y: number; text: string; color: string }[];
}

export function GameBoard({
  grid, sel, busy, result, matchedSet, shaking, flashRows, flashCols,
  activeBooster, obstacles, colorBlind, onTapCell, onSwap, floats
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);
  
  const cellPx = useCallback(() => boardRef.current ? boardRef.current.offsetWidth / COLS : 40, []);

  const onTouchStart = useCallback((r: number, c: number, e: React.TouchEvent) => {
    if (activeBooster === 'hammer') { onTapCell(r, c); return; }
    const touch = e.touches[0];
    swipeRef.current = { r, c, x: touch.clientX, y: touch.clientY };
    if (!busy && result === 'none') {
      // Allow visual selection start
      if (!sel || (sel.r !== r || sel.c !== c)) onTapCell(r, c);
    }
  }, [activeBooster, busy, result, sel, onTapCell]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeRef.current || busy || result !== 'none') { swipeRef.current = null; return; }
    const touch = e.changedTouches[0];
    const dx = touch.clientX - swipeRef.current.x;
    const dy = touch.clientY - swipeRef.current.y;
    const { r, c } = swipeRef.current;
    swipeRef.current = null;

    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return; 

    let tr: number, tc: number;
    if (Math.abs(dx) > Math.abs(dy)) { tr = r; tc = c + (dx > 0 ? 1 : -1); }
    else { tr = r + (dy > 0 ? 1 : -1); tc = c; }

    if (inBounds(tr, tc)) { 
      onSwap({ r, c }, { r: tr, c: tc }); 
    }
  }, [busy, result, onSwap]);

  return (
    <div ref={boardRef} className="relative w-full rounded-2xl overflow-hidden border border-white/20 backdrop-blur-sm"
      style={{
        aspectRatio: `${COLS}/${ROWS}`,
        background: 'rgba(255,255,255,0.1)',
        boxShadow: '0 0 50px rgba(255,255,255,0.06), inset 0 0 30px rgba(255,255,255,0.1), 0 4px 25px rgba(0,0,0,0.4)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => (
            <div key={`bg${r}-${c}`} className="absolute" style={{
              left: `${(c / COLS) * 100}%`, top: `${(r / ROWS) * 100}%`,
              width: `${100 / COLS}%`, height: `${100 / ROWS}%`,
              background: (r + c) % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent',
              borderRight: c < COLS - 1 ? '1px solid rgba(255,255,255,0.025)' : 'none',
              borderBottom: r < ROWS - 1 ? '1px solid rgba(255,255,255,0.025)' : 'none',
            }} />
          ))
        )}
      </div>

      {Array.from(flashRows).map(r => (
        <div key={`fr${r}`} className="absolute pointer-events-none" style={{
          left: 0, top: `${(r / ROWS) * 100}%`, width: '100%', height: `${100 / ROWS}%`,
          background: 'rgba(255,255,255,0.15)', animation: 'gc-row-flash .4s ease-out forwards', zIndex: 5
        }} />
      ))}
      {Array.from(flashCols).map(c => (
        <div key={`fc${c}`} className="absolute pointer-events-none" style={{
          left: `${(c / COLS) * 100}%`, top: 0, width: `${100 / COLS}%`, height: '100%',
          background: 'rgba(255,255,255,0.15)', animation: 'gc-row-flash .4s ease-out forwards', zIndex: 5
        }} />
      ))}

      {grid.map((row, r) =>
        row.map((cell, c) => {
          const isSel = sel?.r === r && sel?.c === c;
          const isMatched = matchedSet.has(`${r},${c}`);
          const isShake = shaking?.includes(`${r},${c}`);
          const wp = 100 / COLS;
          const hp = 100 / ROWS;
          
          const obs = obstacles.find(o => o.pos.r === r && o.pos.c === c);

          return (
            <div key={cell.id}
              className="absolute flex items-center justify-center"
              style={{
                left: `${c * wp}%`, top: `${r * hp}%`, width: `${wp}%`, height: `${hp}%`,
                transition: 'left .2s ease, top .2s ease',
                zIndex: isSel ? 10 : (obs ? 5 : 1),
                cursor: activeBooster === 'hammer' ? 'crosshair' : 'pointer',
              }}
              onClick={() => onTapCell(r, c)}
              onTouchStart={e => { e.preventDefault(); onTouchStart(r, c, e); }}
              onTouchEnd={e => { e.preventDefault(); onTouchEnd(e); }}
            >
              <GemVisual cell={cell} size={cellPx()} selected={isSel} shaking={!!isShake} matched={isMatched} colorBlind={colorBlind} />
              
              {obs && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
                  {obs.type === 'ice' && (
                    <div className="absolute inset-1 rounded-2xl border-[3px] border-white/60 bg-white/20 backdrop-blur-[2px]" 
                         style={{ opacity: obs.layers === 2 ? 1 : 0.6 }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent mix-blend-overlay" />
                    </div>
                  )}
                  {obs.type === 'chain' && (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl"
                         style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                      ⛓️
                    </div>
                  )}
                  {obs.type === 'crate' && (
                    <div className="absolute inset-1 rounded-xl border-[4px] border-[#8B4513] bg-[#DEB887]"
                         style={{ boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }}>
                       <div className="absolute inset-0 flex items-center justify-center opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)' }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {floats.map(f => (
        <div key={f.id} className="pointer-events-none absolute" style={{
          left: f.x, top: f.y, transform: 'translate(-50%,-50%)',
          color: f.color, fontWeight: 900, fontSize: 14, whiteSpace: 'nowrap',
          textShadow: `0 0 8px ${f.color}, 0 2px 4px rgba(0,0,0,0.5)`,
          animation: 'gc-float .9s ease-out forwards', zIndex: 200,
        }}>
          {f.text}
        </div>
      ))}
    </div>
  );
}
