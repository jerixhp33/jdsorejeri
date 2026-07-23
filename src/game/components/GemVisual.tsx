import React from 'react';
import { Cell } from '../engine/types';

export const GEM_STYLES: Record<number, string> = {
  0: 'linear-gradient(135deg, #ff4d4d, #b30000)',
  1: 'linear-gradient(135deg, #4da6ff, #005ce6)',
  2: 'linear-gradient(135deg, #5cd65c, #1f7a1f)',
  3: 'linear-gradient(135deg, #ffdb4d, #b38600)',
  4: 'linear-gradient(135deg, #d24dff, #7a00cc)',
  5: 'linear-gradient(135deg, #ff9933, #cc5200)'
};

export const SYMBOLS: Record<number, string> = {
  0: '♥', 1: '◆', 2: '●', 3: '★', 4: '▲', 5: '✦'
};

const COLORBLIND_SHAPES: Record<number, React.ReactNode> = {
  0: <div style={{ width: '33%', height: '33%', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.7)' }} />,
  1: <div style={{ width: '33%', height: '33%', backgroundColor: 'rgba(255,255,255,0.7)', transform: 'rotate(45deg)' }} />,
  2: <div style={{ width: '33%', height: '33%', backgroundColor: 'rgba(255,255,255,0.7)' }} />,
  3: <div style={{ width: '33%', height: '33%', borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '14px solid rgba(255,255,255,0.7)' }} />,
  4: <div style={{ width: '33%', height: '33%', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.7)' }} />,
  5: <div style={{ width: '33%', height: '33%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ position: 'absolute', width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.7)', transform: 'rotate(45deg)' }}/><div style={{ position: 'absolute', width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.7)', transform: 'rotate(-45deg)' }}/></div>
};

export const BOMB_BG = 'conic-gradient(from 0deg,#ff4757,#ffa502,#2ed573,#3742fa,#e056fd,#ffd32a,#ff4757)';

interface GemVisualProps {
  cell: Cell;
  size: number;
  selected?: boolean;
  shaking?: boolean;
  matched?: boolean;
  colorBlind?: boolean;
}

export const GemVisual = React.memo(function GemVisual({ cell, size, selected, shaking, matched, colorBlind }: GemVisualProps) {
  const s = GEM_STYLES[cell.color];
  const innerSize = size * 0.76;
  const isBomb = cell.special === 'bomb';
  const isStriped = cell.special === 'striped_h' || cell.special === 'striped_v';
  const isWrapped = cell.special === 'wrapped';

  return (
    <div
      style={{
        width: innerSize, height: innerSize,
        borderRadius: isBomb ? '50%' : '22%',
        background: isBomb ? BOMB_BG : s,
        position: 'relative',
        boxShadow: selected
          ? `0 0 0 2.5px rgba(255,255,255,0.5), 0 0 16px rgba(255,255,255,0.3)`
          : `0 3px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)`,
        animation: matched ? 'gc-pop .35s ease-in forwards'
          : shaking ? 'gc-shake .35s ease-in-out'
          : selected ? 'gc-pulse .7s ease-in-out infinite'
          : isBomb ? 'gc-bomb-spin 3s linear infinite'
          : isWrapped ? 'gc-wrapped-glow 1.5s ease-in-out infinite' : undefined,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform .15s ease',
        transform: selected ? 'scale(1.08)' : 'scale(1)',
      } as React.CSSProperties}
    >
      <div style={{
        position: 'absolute', top: '12%', left: '15%', width: '40%', height: '25%',
        borderRadius: '50%', background: 'rgba(255,255,255,0.35)', filter: 'blur(1px)',
        pointerEvents: 'none',
      }} />

      {colorBlind && cell.special === 'none' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {COLORBLIND_SHAPES[cell.color]}
        </div>
      )}

      {isStriped && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          background: cell.special === 'striped_h'
            ? 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.25) 3px, rgba(255,255,255,0.25) 5px)'
            : 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.25) 3px, rgba(255,255,255,0.25) 5px)',
          animation: 'gc-stripe-move 1s linear infinite',
          pointerEvents: 'none',
        }} />
      )}

      {isWrapped && (
        <div style={{
          position: 'absolute', inset: 2, borderRadius: 'inherit',
          border: '2px solid rgba(255,255,255,0.5)',
          pointerEvents: 'none',
        }} />
      )}

      <span style={{
        fontSize: innerSize * 0.38,
        color: isBomb ? '#fff' : 'rgba(255,255,255,0.7)',
        fontWeight: 900,
        textShadow: `0 1px 3px rgba(0,0,0,0.4)`,
        zIndex: 1,
        lineHeight: 1,
        pointerEvents: 'none',
      }}>
        {isBomb ? '💫' : SYMBOLS[cell.color]}
      </span>

      {!matched && (
        <div style={{
          position: 'absolute', top: 0, width: '40%', height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          animation: 'gc-shine 3s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
});
