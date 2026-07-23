'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
type GemType = 0 | 1 | 2 | 3 | 4 | 5;
type Cell = { type: GemType; id: number; matched: boolean };
type Pos = { r: number; c: number };

const COLS = 8;
const ROWS = 9;
const GEM_COUNT = 6;

// Big colorful emoji gems — instantly recognizable on every device
const GEMS: { emoji: string; color: string; glow: string; name: string }[] = [
  { emoji: '🔴', color: '#ff1744', glow: '#ff174480', name: 'Red' },
  { emoji: '🟡', color: '#ffd600', glow: '#ffd60080', name: 'Yellow' },
  { emoji: '🟢', color: '#00e676', glow: '#00e67680', name: 'Green' },
  { emoji: '🔵', color: '#2979ff', glow: '#2979ff80', name: 'Blue' },
  { emoji: '🟣', color: '#d500f9', glow: '#d500f980', name: 'Purple' },
  { emoji: '🟠', color: '#ff9100', glow: '#ff910080', name: 'Orange' },
];

// ─── Sound Engine ────────────────────────────────────────────────────────────
class SFX {
  private ctx: AudioContext | null = null;
  enabled = true;

  private ac(): AudioContext {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
    if (!this.enabled) return;
    try {
      const c = this.ac();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, c.currentTime);
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    } catch {}
  }

  swap() { this.tone(523, 0.06); setTimeout(() => this.tone(659, 0.06), 40); }
  
  match(combo: number) {
    const base = 523 + combo * 100;
    this.tone(base, 0.12, 'sine', 0.14);
    setTimeout(() => this.tone(base * 1.25, 0.12, 'sine', 0.14), 50);
    setTimeout(() => this.tone(base * 1.5, 0.18, 'triangle', 0.1), 100);
  }

  cascade() {
    [880, 1100, 1320].forEach((f, i) => setTimeout(() => this.tone(f, 0.1, 'triangle', 0.08), i * 50));
  }

  fail() { this.tone(200, 0.12, 'square', 0.04); setTimeout(() => this.tone(160, 0.15, 'square', 0.04), 60); }

  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'sine', 0.1), i * 90)); }

  lose() { [392, 349, 330, 262].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sine', 0.08), i * 120)); }
}

const sfx = new SFX();

// ─── Grid Logic ──────────────────────────────────────────────────────────────
let uid = 1;
const rng = (): GemType => Math.floor(Math.random() * GEM_COUNT) as GemType;
const mk = (t?: GemType): Cell => ({ type: t ?? rng(), id: uid++, matched: false });

function buildGrid(): Cell[][] {
  const g: Cell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    g[r] = [];
    for (let c = 0; c < COLS; c++) {
      let cell = mk();
      while (
        (c >= 2 && g[r][c-1].type === cell.type && g[r][c-2].type === cell.type) ||
        (r >= 2 && g[r-1][c].type === cell.type && g[r-2][c].type === cell.type)
      ) cell = mk();
      g[r][c] = cell;
    }
  }
  return g;
}

function clone(g: Cell[][]): Cell[][] {
  return g.map(row => row.map(c => ({ ...c })));
}

function getMatches(g: Cell[][]): Set<string> {
  const m = new Set<string>();
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let run = 1;
    for (let c = 1; c < COLS; c++) {
      if (g[r][c].type === g[r][c-1].type) { run++; }
      else {
        if (run >= 3) for (let i = c - run; i < c; i++) m.add(`${r},${i}`);
        run = 1;
      }
    }
    if (run >= 3) for (let i = COLS - run; i < COLS; i++) m.add(`${r},${i}`);
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    let run = 1;
    for (let r = 1; r < ROWS; r++) {
      if (g[r][c].type === g[r-1][c].type) { run++; }
      else {
        if (run >= 3) for (let i = r - run; i < r; i++) m.add(`${i},${c}`);
        run = 1;
      }
    }
    if (run >= 3) for (let i = ROWS - run; i < ROWS; i++) m.add(`${i},${c}`);
  }
  return m;
}

function swapInGrid(g: Cell[][], a: Pos, b: Pos): Cell[][] {
  const ng = clone(g);
  [ng[a.r][a.c], ng[b.r][b.c]] = [ng[b.r][b.c], ng[a.r][a.c]];
  return ng;
}

function anyValidMove(g: Cell[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c + 1 < COLS && getMatches(swapInGrid(g, {r,c}, {r,c:c+1})).size > 0) return true;
      if (r + 1 < ROWS && getMatches(swapInGrid(g, {r,c}, {r:r+1,c})).size > 0) return true;
    }
  }
  return false;
}

const adj = (a: Pos, b: Pos) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

// ─── Floating Score Component ────────────────────────────────────────────────
function FloatingScore({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  return (
    <div
      className="pointer-events-none absolute font-black text-sm whitespace-nowrap"
      style={{
        left: x, top: y,
        color,
        textShadow: `0 0 8px ${color}`,
        animation: 'floatUp 0.8s ease-out forwards',
        zIndex: 200,
      }}
    >
      {text}
    </div>
  );
}

// ─── Gem Crush Game ──────────────────────────────────────────────────────────
function JDGemCrush() {
  const [grid, setGrid] = useState<Cell[][]>(() => buildGrid());
  const [sel, setSel] = useState<Pos | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [moves, setMoves] = useState(35);
  const [level, setLevel] = useState(1);
  const [target, setTarget] = useState(800);
  const [combo, setCombo] = useState(0);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shaking, setShaking] = useState<string | null>(null);
  const [floats, setFloats] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([]);
  const [matchedCells, setMatchedCells] = useState<Set<string>>(new Set());
  const boardRef = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<{ r: number; c: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const s = localStorage.getItem('jd_gc_best');
    if (s) setBest(parseInt(s, 10));
  }, []);

  const cellPx = useCallback(() => {
    if (!boardRef.current) return 42;
    return boardRef.current.offsetWidth / COLS;
  }, []);

  // ── Match-cascade loop ──
  const cascade = useCallback(async (g: Cell[][], startCombo: number) => {
    let cur = clone(g);
    let c = startCombo;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const matches = getMatches(cur);
      if (matches.size === 0) break;

      c++;
      // Highlight matched
      setMatchedCells(new Set(matches));
      setGrid(clone(cur));

      if (c > 1) sfx.cascade(); else sfx.match(c);

      // Score
      const pts = matches.size * 50 * c;
      setScore(s => s + pts);
      setCombo(c);

      // Float scores at match positions
      const cp = cellPx();
      const positions = Array.from(matches).map(s => { const [r, cc] = s.split(',').map(Number); return { r, c: cc }; });
      const centerR = positions.reduce((a, p) => a + p.r, 0) / positions.length;
      const centerC = positions.reduce((a, p) => a + p.c, 0) / positions.length;
      const gemType = cur[positions[0].r][positions[0].c].type;
      setFloats(prev => [...prev, {
        id: uid++,
        x: centerC * cp + cp / 2,
        y: centerR * cp + cp / 2,
        text: c > 1 ? `${c}x +${pts}` : `+${pts}`,
        color: GEMS[gemType].color,
      }]);
      setTimeout(() => setFloats(prev => prev.slice(1)), 900);

      await new Promise(r => setTimeout(r, 350));

      // Remove matched
      for (const key of matches) {
        const [r, cc] = key.split(',').map(Number);
        cur[r][cc] = { ...cur[r][cc], matched: true };
      }

      // Gravity: collapse columns
      for (let col = 0; col < COLS; col++) {
        let write = ROWS - 1;
        for (let row = ROWS - 1; row >= 0; row--) {
          if (!cur[row][col].matched) {
            if (write !== row) cur[write][col] = { ...cur[row][col] };
            write--;
          }
        }
        for (let row = write; row >= 0; row--) {
          cur[row][col] = mk();
        }
      }

      setMatchedCells(new Set());
      setGrid(clone(cur));
      await new Promise(r => setTimeout(r, 300));
    }

    setCombo(0);
    return cur;
  }, [cellPx]);

  // ── Handle cell interaction ──
  const doSwap = useCallback(async (a: Pos, b: Pos) => {
    if (busy || over || won) return;
    if (!adj(a, b)) return;

    setBusy(true);
    sfx.swap();

    // Swap
    const swapped = swapInGrid(grid, a, b);
    setGrid(swapped);
    await new Promise(r => setTimeout(r, 200));

    const matches = getMatches(swapped);
    if (matches.size === 0) {
      sfx.fail();
      setShaking(`${a.r},${a.c}|${b.r},${b.c}`);
      await new Promise(r => setTimeout(r, 350));
      setShaking(null);
      setGrid(clone(grid)); // swap back
      setBusy(false);
      return;
    }

    setMoves(m => m - 1);
    setSel(null);
    const final = await cascade(swapped, 0);
    setGrid(final);
    setBusy(false);
  }, [grid, busy, over, won, cascade]);

  const tapCell = useCallback((r: number, c: number) => {
    if (busy || over || won) return;
    const pos: Pos = { r, c };
    if (!sel) { setSel(pos); return; }
    if (sel.r === r && sel.c === c) { setSel(null); return; }
    if (adj(sel, pos)) {
      doSwap(sel, pos);
      setSel(null);
    } else {
      setSel(pos);
    }
  }, [sel, busy, over, won, doSwap]);

  // ── Touch swipe ──
  const onTouchStart = useCallback((r: number, c: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeStart.current = { r, c, x: touch.clientX, y: touch.clientY };
    setSel({ r, c });
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeStart.current || busy || over || won) { swipeStart.current = null; return; }
    const touch = e.changedTouches[0];
    const dx = touch.clientX - swipeStart.current.x;
    const dy = touch.clientY - swipeStart.current.y;
    const { r, c } = swipeStart.current;
    swipeStart.current = null;

    const threshold = 15;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      // It's a tap, handled by tapCell
      return;
    }

    let tr: number, tc: number;
    if (Math.abs(dx) > Math.abs(dy)) {
      tr = r; tc = c + (dx > 0 ? 1 : -1);
    } else {
      tr = r + (dy > 0 ? 1 : -1); tc = c;
    }

    if (tr >= 0 && tr < ROWS && tc >= 0 && tc < COLS) {
      setSel(null);
      doSwap({ r, c }, { r: tr, c: tc });
    }
  }, [busy, over, won, doSwap]);

  // ── Win / Lose ──
  useEffect(() => {
    if (busy) return;
    if (score >= target && !won) {
      setWon(true);
      sfx.win();
      const nb = Math.max(score, best);
      setBest(nb);
      localStorage.setItem('jd_gc_best', String(nb));
    } else if (moves <= 0 && score < target && !over) {
      setOver(true);
      sfx.lose();
      const nb = Math.max(score, best);
      setBest(nb);
      localStorage.setItem('jd_gc_best', String(nb));
    } else if (!over && !won && moves > 0 && !anyValidMove(grid)) {
      // Reshuffle
      setGrid(buildGrid());
    }
  }, [score, target, moves, grid, busy, over, won, best]);

  const nextLvl = () => {
    const nl = level + 1;
    setLevel(nl);
    setTarget(800 + (nl - 1) * 400);
    setMoves(35);
    setScore(0);
    setGrid(buildGrid());
    setWon(false);
    setOver(false);
    setSel(null);
  };

  const restart = () => {
    setLevel(1);
    setTarget(800);
    setMoves(35);
    setScore(0);
    setGrid(buildGrid());
    setWon(false);
    setOver(false);
    setCombo(0);
    setSel(null);
  };

  const pct = Math.min(100, (score / target) * 100);

  return (
    <div className="w-full max-w-[420px] mx-auto select-none" style={{ touchAction: 'none' }}>
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-40px) scale(1.3); opacity: 0; }
        }
        @keyframes gemPop {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes gemDrop {
          0% { transform: translateY(-120%); }
          60% { transform: translateY(5%); }
          80% { transform: translateY(-3%); }
          100% { transform: translateY(0); }
        }
        @keyframes cellShake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        @keyframes selectedPulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes starBurst {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          100% { transform: scale(2) rotate(180deg); opacity: 0; }
        }
        @keyframes overlayIn {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes comboShake {
          0%,100% { transform: translateX(-50%) rotate(0deg); }
          25% { transform: translateX(-50%) rotate(-3deg); }
          75% { transform: translateX(-50%) rotate(3deg); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">💎</span>
            <span className="text-[13px] font-extrabold tracking-wide text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #c8a96e, #f0d78c, #c8a96e)' }}>
              JD GEM CRUSH
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-white/30 text-[10px] font-medium">Level {level}</span>
            <span className="text-white/15">·</span>
            <span className="text-white/30 text-[10px]">🏆 {best.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { sfx.enabled = !sfx.enabled; /* force re-render */ setCombo(c => c); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.03] text-sm hover:bg-white/[0.08] active:scale-95 transition-all"
          >
            {sfx.enabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={restart}
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.03] text-sm hover:bg-white/[0.08] active:scale-95 transition-all"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Score HUD */}
      <div className="mb-3 p-3 rounded-2xl border border-white/[0.06] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(200,169,110,0.06) 0%, rgba(10,10,10,0.8) 100%)' }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[9px] text-white/35 uppercase tracking-widest font-bold">Score</p>
              <p className="text-white font-extrabold text-xl leading-none mt-0.5">{score.toLocaleString()}</p>
            </div>
            <div className="w-px h-9 bg-white/10" />
            <div>
              <p className="text-[9px] text-white/35 uppercase tracking-widest font-bold">Target</p>
              <p className="text-xl font-extrabold leading-none mt-0.5" style={{ color: '#c8a96e' }}>{target.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-center px-3.5 py-1.5 rounded-2xl border border-white/[0.08]" style={{ background: moves <= 5 ? 'rgba(255,23,68,0.1)' : 'rgba(255,255,255,0.02)' }}>
            <p className="text-[9px] text-white/35 uppercase tracking-widest font-bold">Moves</p>
            <p className={`font-extrabold text-xl leading-none mt-0.5 ${moves <= 5 ? 'text-red-400' : 'text-white'}`}>{moves}</p>
          </div>
        </div>
        {/* Progress */}
        <div className="w-full h-2.5 rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.05]">
          <div className="h-full rounded-full transition-all duration-700 ease-out relative" style={{
            width: `${pct}%`,
            background: pct >= 100 ? 'linear-gradient(90deg, #00e676, #69f0ae)' : 'linear-gradient(90deg, #b8860b, #c8a96e, #e9c86e)',
          }}>
            {pct > 8 && <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />}
          </div>
        </div>
        {/* Star markers */}
        <div className="relative w-full h-0 mt-1">
          {[33, 66, 100].map((p, i) => (
            <div key={i} className="absolute -top-1 -translate-x-1/2 text-[10px] transition-all duration-500" style={{ left: `${p}%`, opacity: pct >= p ? 1 : 0.2, transform: `translateX(-50%) scale(${pct >= p ? 1.2 : 0.8})` }}>
              ⭐
            </div>
          ))}
        </div>
      </div>

      {/* Combo banner */}
      {combo > 1 && (
        <div className="text-center mb-2">
          <span
            className="inline-block px-4 py-1 rounded-full text-xs font-black text-black"
            style={{
              background: 'linear-gradient(90deg, #c8a96e, #f0d78c, #c8a96e)',
              animation: 'comboShake 0.3s ease-in-out infinite',
              boxShadow: '0 0 20px rgba(200,169,110,0.4)',
            }}
          >
            🔥 {combo}x COMBO! 🔥
          </span>
        </div>
      )}

      {/* ═══ GAME BOARD ═══ */}
      <div
        ref={boardRef}
        className="relative w-full rounded-2xl overflow-hidden border-2 border-[#c8a96e]/20"
        style={{
          aspectRatio: `${COLS}/${ROWS}`,
          background: 'linear-gradient(180deg, #1a1510 0%, #0d0b08 100%)',
          boxShadow: '0 0 60px rgba(200,169,110,0.08), inset 0 0 40px rgba(0,0,0,0.6), 0 4px 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Background grid pattern */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) => (
              <div
                key={`bg-${r}-${c}`}
                className="absolute"
                style={{
                  left: `${(c / COLS) * 100}%`,
                  top: `${(r / ROWS) * 100}%`,
                  width: `${100 / COLS}%`,
                  height: `${100 / ROWS}%`,
                  background: (r + c) % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  borderRight: c < COLS - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  borderBottom: r < ROWS - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                }}
              />
            ))
          )}
        </div>

        {/* Gems */}
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const gem = GEMS[cell.type];
            const isSel = sel?.r === r && sel?.c === c;
            const isMatched = matchedCells.has(`${r},${c}`);
            const isShake = shaking?.includes(`${r},${c}`);

            const wp = 100 / COLS;
            const hp = 100 / ROWS;

            return (
              <div
                key={cell.id}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${c * wp}%`,
                  top: `${r * hp}%`,
                  width: `${wp}%`,
                  height: `${hp}%`,
                  transition: 'left 0.2s ease, top 0.2s ease',
                  animation: isMatched ? 'gemPop 0.35s ease-in forwards'
                    : isShake ? 'cellShake 0.35s ease-in-out'
                    : undefined,
                  zIndex: isSel ? 10 : 1,
                }}
                onClick={() => tapCell(r, c)}
                onTouchStart={(e) => { e.preventDefault(); onTouchStart(r, c, e); }}
                onTouchEnd={(e) => { e.preventDefault(); onTouchEnd(e); }}
              >
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    width: '78%',
                    height: '78%',
                    fontSize: `min(calc(${wp}vw * 0.55), 32px)`,
                    borderRadius: '22%',
                    background: isSel
                      ? `radial-gradient(circle, ${gem.glow} 0%, transparent 70%)`
                      : 'transparent',
                    animation: isSel ? 'selectedPulse 0.8s ease-in-out infinite' : undefined,
                    boxShadow: isSel ? `0 0 0 2px ${gem.color}, 0 0 16px ${gem.glow}` : undefined,
                    filter: isMatched ? 'brightness(2)' : undefined,
                    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                    lineHeight: 1,
                  }}
                >
                  <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                    {gem.emoji}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Floating scores */}
        {floats.map(f => <FloatingScore key={f.id} x={f.x} y={f.y} text={f.text} color={f.color} />)}

        {/* Game Over */}
        {over && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50">
            <div className="text-center p-6" style={{ animation: 'overlayIn 0.5s ease-out forwards' }}>
              <div className="text-5xl mb-3">😢</div>
              <h3 className="text-white font-extrabold text-2xl mb-1">Game Over!</h3>
              <p className="text-white/50 text-sm mb-1">Score: <strong className="text-white">{score.toLocaleString()}</strong></p>
              <p className="text-[#c8a96e] text-xs mb-5">Best: {best.toLocaleString()}</p>
              <button
                onClick={restart}
                className="px-8 py-3 rounded-full text-sm font-bold text-black active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(135deg, #c8a96e, #e9c86e)', boxShadow: '0 4px 20px rgba(200,169,110,0.4)' }}
              >
                🔄 Play Again
              </button>
            </div>
          </div>
        )}

        {/* Level Complete */}
        {won && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50">
            <div className="text-center p-6" style={{ animation: 'overlayIn 0.5s ease-out forwards' }}>
              <div className="text-5xl mb-2">🎉</div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3].map(i => (
                  <span key={i} className="text-2xl" style={{ animation: `starBurst 0.5s ease-out ${i * 0.15}s backwards` }}>⭐</span>
                ))}
              </div>
              <h3 className="text-white font-extrabold text-2xl mb-1">Level {level} Complete!</h3>
              <p className="text-sm mb-1" style={{ color: '#c8a96e' }}>Score: <strong>{score.toLocaleString()}</strong></p>
              <p className="text-white/40 text-xs mb-5">{moves} moves remaining</p>
              <button
                onClick={nextLvl}
                className="px-8 py-3 rounded-full text-sm font-bold text-black active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(135deg, #c8a96e, #e9c86e)', boxShadow: '0 4px 20px rgba(200,169,110,0.4)' }}
              >
                Next Level ✨
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hint text */}
      <p className="text-center text-white/20 text-[10px] mt-2.5 font-medium tracking-wider">
        TAP or SWIPE to match 3+ gems
      </p>
    </div>
  );
}

// ─── Offline Status Monitor (exported) ───────────────────────────────────────
export function OfflineStatusMonitor() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-start p-4 pt-6 overflow-y-auto">
      <div className="absolute w-[350px] h-[350px] rounded-full top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50 animate-pulse"
        style={{ background: 'radial-gradient(circle, rgba(200,169,110,0.1) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
        {/* Compact status banner */}
        <div className="w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl px-5 py-4 backdrop-blur-xl shadow-2xl mb-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#c8a96e]/5 border border-[#c8a96e]/15 flex items-center justify-center flex-shrink-0">
            <svg width="28" height="28" viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg" fill="none">
              <defs>
                <linearGradient id="s" x1="40" y1="40" x2="170" y2="340" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFF"/><stop offset="100%" stopColor="#BABABA"/>
                </linearGradient>
                <linearGradient id="g" x1="250" y1="20" x2="390" y2="380" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFF2C3"/><stop offset="50%" stopColor="#C99537"/><stop offset="100%" stopColor="#8C6120"/>
                </linearGradient>
              </defs>
              <path fill="url(#s)" d="M122 72C148 72 168 88 168 115L168 278C168 345 131 385 83 385C49 385 26 365 26 337C26 312 45 293 69 293C92 293 109 308 109 329C109 342 102 352 92 360C98 362 106 363 116 363C143 363 152 335 152 289L152 118C152 92 139 84 122 82Z"/>
              <path fill="url(#g)" d="M218 66L218 72L275 72C355 72 394 121 394 210C394 299 355 348 275 348L218 348L218 354L280 354C374 354 414 300 414 210C414 120 374 66 280 66Z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-base font-bold text-white">You&apos;re Offline</h1>
            <p className="text-white/40 text-xs leading-snug mt-0.5">
              We&apos;ll reconnect you automatically.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[#c8a96e] animate-pulse flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#c8a96e]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Game */}
        <JDGemCrush />

        <div className="text-white/30 text-[10px] mt-4 text-center">
          Need help?{' '}
          <a href="https://wa.me/919360490974" target="_blank" rel="noopener noreferrer" className="text-[#c8a96e] font-medium hover:underline">
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  );
}
