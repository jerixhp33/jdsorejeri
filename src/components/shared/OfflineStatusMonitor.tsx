'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
type GemType = 'ruby' | 'sapphire' | 'emerald' | 'topaz' | 'amethyst' | 'diamond';
type CellState = { type: GemType; id: number; matched: boolean; falling: boolean; isNew: boolean };
type Position = { row: number; col: number };

const GEM_TYPES: GemType[] = ['ruby', 'sapphire', 'emerald', 'topaz', 'amethyst', 'diamond'];
const GRID_SIZE = 8;
const BASE_POINTS = 50;

const GEM_COLORS: Record<GemType, { bg: string; glow: string; emoji: string }> = {
  ruby:     { bg: 'linear-gradient(135deg, #ff1744, #d50000)', glow: 'rgba(255,23,68,0.6)',   emoji: '💎' },
  sapphire: { bg: 'linear-gradient(135deg, #448aff, #2962ff)', glow: 'rgba(68,138,255,0.6)',  emoji: '🔷' },
  emerald:  { bg: 'linear-gradient(135deg, #00e676, #00c853)', glow: 'rgba(0,230,118,0.6)',   emoji: '💚' },
  topaz:    { bg: 'linear-gradient(135deg, #ffd740, #ffab00)', glow: 'rgba(255,215,64,0.6)',   emoji: '⭐' },
  amethyst: { bg: 'linear-gradient(135deg, #e040fb, #aa00ff)', glow: 'rgba(224,64,251,0.6)',  emoji: '🔮' },
  diamond:  { bg: 'linear-gradient(135deg, #e0e0e0, #ffffff)', glow: 'rgba(255,255,255,0.7)', emoji: '✨' },
};

// ─── Sound Engine (Web Audio API) ────────────────────────────────────────────
class SoundEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch { /* ignore audio errors */ }
  }

  swap() {
    this.playTone(600, 0.08, 'sine', 0.1);
    setTimeout(() => this.playTone(800, 0.08, 'sine', 0.1), 40);
  }

  match(combo: number) {
    const baseFreq = 523 + combo * 80; // C5 going up
    this.playTone(baseFreq, 0.15, 'sine', 0.12);
    setTimeout(() => this.playTone(baseFreq * 1.25, 0.15, 'sine', 0.12), 60);
    setTimeout(() => this.playTone(baseFreq * 1.5, 0.2, 'triangle', 0.1), 120);
  }

  cascade() {
    this.playTone(880, 0.1, 'triangle', 0.08);
    setTimeout(() => this.playTone(1100, 0.1, 'triangle', 0.08), 50);
    setTimeout(() => this.playTone(1320, 0.15, 'triangle', 0.08), 100);
  }

  levelUp() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.3, 'sine', 0.12), i * 100);
    });
  }

  noMatch() {
    this.playTone(200, 0.15, 'square', 0.05);
    setTimeout(() => this.playTone(150, 0.2, 'square', 0.05), 80);
  }

  gameOver() {
    const notes = [392, 349, 330, 262]; // G4, F4, E4, C4
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.4, 'sine', 0.1), i * 150);
    });
  }
}

const sound = new SoundEngine();

// ─── Grid Helpers ────────────────────────────────────────────────────────────
let nextId = 1;
function randomGem(): GemType {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

function createCell(type?: GemType, isNew = false): CellState {
  return { type: type || randomGem(), id: nextId++, matched: false, falling: false, isNew };
}

function initGrid(): CellState[][] {
  const grid: CellState[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let cell = createCell();
      // Ensure no initial matches
      while (
        (c >= 2 && grid[r][c - 1].type === cell.type && grid[r][c - 2].type === cell.type) ||
        (r >= 2 && grid[r - 1][c].type === cell.type && grid[r - 2][c].type === cell.type)
      ) {
        cell = createCell();
      }
      grid[r][c] = cell;
    }
  }
  return grid;
}

function copyGrid(g: CellState[][]): CellState[][] {
  return g.map(row => row.map(cell => ({ ...cell })));
}

function findMatches(grid: CellState[][]): Position[] {
  const matched = new Set<string>();

  // Horizontal
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c <= GRID_SIZE - 3; c++) {
      const t = grid[r][c].type;
      if (t === grid[r][c + 1].type && t === grid[r][c + 2].type) {
        let end = c + 2;
        while (end + 1 < GRID_SIZE && grid[r][end + 1].type === t) end++;
        for (let i = c; i <= end; i++) matched.add(`${r},${i}`);
      }
    }
  }

  // Vertical
  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r <= GRID_SIZE - 3; r++) {
      const t = grid[r][c].type;
      if (t === grid[r + 1][c].type && t === grid[r + 2][c].type) {
        let end = r + 2;
        while (end + 1 < GRID_SIZE && grid[end + 1][c].type === t) end++;
        for (let i = r; i <= end; i++) matched.add(`${i},${c}`);
      }
    }
  }

  return Array.from(matched).map(s => {
    const [row, col] = s.split(',').map(Number);
    return { row, col };
  });
}

function isAdjacent(a: Position, b: Position): boolean {
  return (Math.abs(a.row - b.row) + Math.abs(a.col - b.col)) === 1;
}

function swapCells(grid: CellState[][], a: Position, b: Position): CellState[][] {
  const g = copyGrid(grid);
  const temp = g[a.row][a.col];
  g[a.row][a.col] = g[b.row][b.col];
  g[b.row][b.col] = temp;
  return g;
}

function hasAnyValidMove(grid: CellState[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      // Try swapping right
      if (c + 1 < GRID_SIZE) {
        const g = swapCells(grid, { row: r, col: c }, { row: r, col: c + 1 });
        if (findMatches(g).length > 0) return true;
      }
      // Try swapping down
      if (r + 1 < GRID_SIZE) {
        const g = swapCells(grid, { row: r, col: c }, { row: r + 1, col: c });
        if (findMatches(g).length > 0) return true;
      }
    }
  }
  return false;
}

// ─── Particle Effect Component ───────────────────────────────────────────────
function ParticleExplosion({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y, zIndex: 100 }}>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 360;
        const dist = 20 + Math.random() * 15;
        return (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 6px ${color}`,
              animation: `particle-fly 0.5s ease-out forwards`,
              '--tx': `${Math.cos(angle * Math.PI / 180) * dist}px`,
              '--ty': `${Math.sin(angle * Math.PI / 180) * dist}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

// ─── Main Game Component ─────────────────────────────────────────────────────
function JDGemCrush() {
  const [grid, setGrid] = useState<CellState[][]>(() => initGrid());
  const [selected, setSelected] = useState<Position | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [level, setLevel] = useState(1);
  const [targetScore, setTargetScore] = useState(1000);
  const [combo, setCombo] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [showComboText, setShowComboText] = useState<{ text: string; id: number } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [shakeCells, setShakeCells] = useState<Set<string>>(new Set());
  const boardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<Position | null>(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('jd_gemcrush_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Cell size depends on the board width
  const getCellSize = useCallback(() => {
    if (boardRef.current) {
      return boardRef.current.offsetWidth / GRID_SIZE;
    }
    return 40;
  }, []);

  // Process matches and cascades
  const processMatches = useCallback(async (currentGrid: CellState[][], currentCombo: number) => {
    let g = copyGrid(currentGrid);
    let matches = findMatches(g);
    let totalCombo = currentCombo;

    while (matches.length > 0) {
      totalCombo++;

      // Mark matched
      for (const pos of matches) {
        g[pos.row][pos.col].matched = true;
      }
      setGrid(copyGrid(g));

      // Particles
      const cellSize = getCellSize();
      const newParticles = matches.map(pos => ({
        id: nextId++,
        x: pos.col * cellSize + cellSize / 2,
        y: pos.row * cellSize + cellSize / 2,
        color: GEM_COLORS[g[pos.row][pos.col].type].glow,
      }));
      setParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 500);

      // Sound
      if (soundOn) {
        if (totalCombo > 1) sound.cascade();
        else sound.match(totalCombo);
      }

      // Score
      const matchPoints = matches.length * BASE_POINTS * totalCombo;
      setScore(s => {
        const ns = s + matchPoints;
        return ns;
      });
      setCombo(totalCombo);

      if (totalCombo > 1) {
        setShowComboText({ text: `${totalCombo}x COMBO! +${matchPoints}`, id: nextId++ });
        setTimeout(() => setShowComboText(null), 1200);
      }

      await new Promise(r => setTimeout(r, 300));

      // Remove matched cells and collapse
      for (let c = 0; c < GRID_SIZE; c++) {
        let writeRow = GRID_SIZE - 1;
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (!g[r][c].matched) {
            if (writeRow !== r) {
              g[writeRow][c] = { ...g[r][c], falling: true };
              g[r][c] = createCell(undefined, true);
            }
            writeRow--;
          }
        }
        // Fill empty top
        for (let r = writeRow; r >= 0; r--) {
          g[r][c] = createCell(undefined, true);
        }
      }

      setGrid(copyGrid(g));
      await new Promise(r => setTimeout(r, 350));

      // Reset animations
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          g[r][c].falling = false;
          g[r][c].isNew = false;
          g[r][c].matched = false;
        }
      }
      setGrid(copyGrid(g));

      matches = findMatches(g);
    }

    setCombo(0);
    return g;
  }, [getCellSize, soundOn]);

  // Handle gem click/tap
  const handleCellClick = useCallback(async (row: number, col: number) => {
    if (animating || gameOver || levelComplete) return;

    const pos: Position = { row, col };

    if (!selected) {
      setSelected(pos);
      return;
    }

    if (selected.row === row && selected.col === col) {
      setSelected(null);
      return;
    }

    if (!isAdjacent(selected, pos)) {
      setSelected(pos);
      return;
    }

    // Attempt swap
    setAnimating(true);
    if (soundOn) sound.swap();

    const swapped = swapCells(grid, selected, pos);
    setGrid(swapped);

    await new Promise(r => setTimeout(r, 200));

    const matches = findMatches(swapped);
    if (matches.length === 0) {
      // No match — shake and swap back
      if (soundOn) sound.noMatch();
      setShakeCells(new Set([`${selected.row},${selected.col}`, `${row},${col}`]));
      await new Promise(r => setTimeout(r, 300));
      setShakeCells(new Set());
      setGrid(copyGrid(grid));
      setSelected(null);
      setAnimating(false);
      return;
    }

    setSelected(null);
    setMoves(m => m - 1);

    const finalGrid = await processMatches(swapped, 0);
    setGrid(finalGrid);
    setAnimating(false);
  }, [selected, grid, animating, gameOver, levelComplete, soundOn, processMatches]);

  // Touch handling for swipe gestures
  const handleTouchStart = useCallback((row: number, col: number) => {
    touchStartRef.current = { row, col };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, row: number, col: number) => {
    if (!touchStartRef.current || animating || gameOver || levelComplete) return;
    
    const start = touchStartRef.current;
    touchStartRef.current = null;

    // If same cell, treat as click
    if (start.row === row && start.col === col) {
      handleCellClick(row, col);
      return;
    }

    // Determine swipe direction
    const dRow = row - start.row;
    const dCol = col - start.col;
    
    let target: Position;
    if (Math.abs(dRow) > Math.abs(dCol)) {
      target = { row: start.row + (dRow > 0 ? 1 : -1), col: start.col };
    } else {
      target = { row: start.row, col: start.col + (dCol > 0 ? 1 : -1) };
    }

    if (target.row >= 0 && target.row < GRID_SIZE && target.col >= 0 && target.col < GRID_SIZE) {
      setSelected(start);
      setTimeout(() => handleCellClick(target.row, target.col), 10);
    }
  }, [animating, gameOver, levelComplete, handleCellClick]);

  // Check level complete or game over
  useEffect(() => {
    if (animating) return;

    if (score >= targetScore && !levelComplete) {
      setLevelComplete(true);
      if (soundOn) sound.levelUp();
      const newHS = Math.max(score, highScore);
      setHighScore(newHS);
      localStorage.setItem('jd_gemcrush_highscore', String(newHS));
      return;
    }

    if (moves <= 0 && score < targetScore && !gameOver) {
      setGameOver(true);
      if (soundOn) sound.gameOver();
      const newHS = Math.max(score, highScore);
      setHighScore(newHS);
      localStorage.setItem('jd_gemcrush_highscore', String(newHS));
      return;
    }

    // No valid moves — reshuffle
    if (!gameOver && !levelComplete && moves > 0 && !hasAnyValidMove(grid)) {
      setGrid(initGrid());
    }
  }, [score, targetScore, moves, grid, animating, gameOver, levelComplete, highScore, soundOn]);

  // Next level
  const nextLevel = useCallback(() => {
    const newLevel = level + 1;
    setLevel(newLevel);
    setTargetScore(1000 + (newLevel - 1) * 500);
    setMoves(30);
    setScore(0);
    setGrid(initGrid());
    setLevelComplete(false);
    setGameOver(false);
  }, [level]);

  // Restart
  const restart = useCallback(() => {
    setLevel(1);
    setTargetScore(1000);
    setMoves(30);
    setScore(0);
    setGrid(initGrid());
    setLevelComplete(false);
    setGameOver(false);
    setCombo(0);
    setSelected(null);
  }, []);

  const progressPercent = Math.min(100, (score / targetScore) * 100);

  return (
    <div className="w-full max-w-[400px] mx-auto select-none" style={{ touchAction: 'none' }}>
      {/* Inline CSS for animations */}
      <style>{`
        @keyframes particle-fly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        @keyframes gem-pop {
          0% { transform: scale(1); }
          50% { transform: scale(0); }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes gem-fall {
          0% { transform: translateY(-100%); opacity: 0; }
          60% { opacity: 1; }
          100% { transform: translateY(0); }
        }
        @keyframes gem-new {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          70% { transform: scale(1.15) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes cell-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        @keyframes combo-pop {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          40% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
          100% { transform: translate(-50%, -80%) scale(1); opacity: 0; }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(200,169,110,0.6); }
          100% { box-shadow: 0 0 0 6px rgba(200,169,110,0); }
        }
        @keyframes level-celebration {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .gem-cell { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .gem-matched { animation: gem-pop 0.3s ease-in forwards; }
        .gem-falling { animation: gem-fall 0.35s ease-out forwards; }
        .gem-new { animation: gem-new 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .cell-shaking { animation: cell-shake 0.3s ease-in-out; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#c8a96e]">✦ JD Gem Crush ✦</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-white/40 text-[10px]">Level {level}</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40 text-[10px]">Best: {highScore.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundOn(s => !s)}
            className="text-[10px] px-2 py-1 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
          <button
            onClick={restart}
            className="text-[10px] px-2 py-1 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Score Bar */}
      <div className="mb-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Score</p>
              <p className="text-white font-bold text-lg leading-tight">{score.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Target</p>
              <p className="text-[#c8a96e] font-bold text-lg leading-tight">{targetScore.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-center px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Moves</p>
            <p className={`font-bold text-lg leading-tight ${moves <= 5 ? 'text-red-400' : 'text-white'}`}>{moves}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              background: progressPercent >= 100
                ? 'linear-gradient(90deg, #00e676, #69f0ae)'
                : 'linear-gradient(90deg, #c8a96e, #e9c86e)',
            }}
          />
        </div>
      </div>

      {/* Combo indicator */}
      {combo > 1 && (
        <div className="text-center mb-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#c8a96e] to-[#e9c86e] text-black animate-bounce">
            {combo}x COMBO!
          </span>
        </div>
      )}

      {/* Game Board */}
      <div
        ref={boardRef}
        className="relative aspect-square w-full rounded-2xl overflow-hidden border border-white/[0.08]"
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(20,15,8,0.95) 100%)',
          boxShadow: '0 0 40px rgba(200,169,110,0.08), inset 0 0 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04 }}>
          {Array.from({ length: GRID_SIZE - 1 }).map((_, i) => (
            <div key={`h-${i}`}>
              <div className="absolute w-full h-px bg-white" style={{ top: `${((i + 1) / GRID_SIZE) * 100}%` }} />
              <div className="absolute h-full w-px bg-white" style={{ left: `${((i + 1) / GRID_SIZE) * 100}%` }} />
            </div>
          ))}
        </div>

        {/* Gems */}
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const gem = GEM_COLORS[cell.type];
            const isSelected = selected?.row === r && selected?.col === c;
            const isShaking = shakeCells.has(`${r},${c}`);
            const cellPct = 100 / GRID_SIZE;

            let animClass = 'gem-cell';
            if (cell.matched) animClass += ' gem-matched';
            else if (cell.falling) animClass += ' gem-falling';
            else if (cell.isNew) animClass += ' gem-new';
            if (isShaking) animClass += ' cell-shaking';

            return (
              <div
                key={cell.id}
                className={`absolute flex items-center justify-center cursor-pointer ${animClass}`}
                style={{
                  left: `${c * cellPct}%`,
                  top: `${r * cellPct}%`,
                  width: `${cellPct}%`,
                  height: `${cellPct}%`,
                  padding: '8%',
                }}
                onClick={() => handleCellClick(r, c)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleTouchStart(r, c);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleTouchEnd(e, r, c);
                }}
              >
                <div
                  className="w-full h-full rounded-[25%] flex items-center justify-center transition-shadow duration-200"
                  style={{
                    background: gem.bg,
                    boxShadow: isSelected
                      ? `0 0 0 2px #c8a96e, 0 0 12px ${gem.glow}, 0 0 24px ${gem.glow}`
                      : `0 2px 8px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.25)`,
                    animation: isSelected ? 'pulse-ring 1s infinite' : undefined,
                    transform: isSelected ? 'scale(1.1)' : undefined,
                  }}
                >
                  {/* Shine effect */}
                  <div
                    className="absolute top-[15%] left-[20%] w-[30%] h-[20%] rounded-full pointer-events-none"
                    style={{
                      background: 'rgba(255,255,255,0.35)',
                      filter: 'blur(1px)',
                    }}
                  />
                </div>
              </div>
            );
          })
        )}

        {/* Particles */}
        {particles.map(p => (
          <ParticleExplosion key={p.id} x={p.x} y={p.y} color={p.color} />
        ))}

        {/* Combo text */}
        {showComboText && (
          <div
            key={showComboText.id}
            className="absolute top-1/2 left-1/2 text-2xl font-black pointer-events-none whitespace-nowrap"
            style={{
              animation: 'combo-pop 1.2s ease-out forwards',
              background: 'linear-gradient(90deg, #c8a96e, #fff, #c8a96e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 20px rgba(200,169,110,0.5)',
              filter: 'drop-shadow(0 0 10px rgba(200,169,110,0.5))',
              zIndex: 50,
            }}
          >
            {showComboText.text}
          </div>
        )}

        {/* Game Over overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center" style={{ animation: 'level-celebration 0.5s ease-out forwards' }}>
              <div className="text-4xl mb-3">💔</div>
              <h3 className="text-white font-bold text-xl mb-1">Game Over</h3>
              <p className="text-white/50 text-sm mb-1">Score: {score.toLocaleString()}</p>
              <p className="text-[#c8a96e] text-xs mb-4">Best: {highScore.toLocaleString()}</p>
              <button
                onClick={restart}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-black"
                style={{ background: 'linear-gradient(135deg, #c8a96e, #e9c86e)' }}
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Level Complete overlay */}
        {levelComplete && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center" style={{ animation: 'level-celebration 0.5s ease-out forwards' }}>
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-white font-bold text-xl mb-1">Level {level} Complete!</h3>
              <p className="text-[#c8a96e] text-sm mb-1">Score: {score.toLocaleString()}</p>
              <p className="text-white/50 text-xs mb-4">{moves} moves remaining</p>
              <button
                onClick={nextLevel}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-black"
                style={{ background: 'linear-gradient(135deg, #c8a96e, #e9c86e)' }}
              >
                Next Level →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1 mt-3 flex-wrap">
        {GEM_TYPES.map(type => (
          <div
            key={type}
            className="w-4 h-4 rounded-[4px]"
            style={{
              background: GEM_COLORS[type].bg,
              boxShadow: `0 1px 4px rgba(0,0,0,0.3)`,
            }}
          />
        ))}
        <span className="text-white/30 text-[10px] ml-1">Match 3+ to score!</span>
      </div>
    </div>
  );
}

// ─── Offline Status Monitor ──────────────────────────────────────────────────
export function OfflineStatusMonitor() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center p-5 overflow-y-auto">
      {/* Ambient Glow */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(200, 169, 110, 0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[440px] text-center flex flex-col items-center">
        {/* Official JD Logo */}
        <div className="mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-[#c8a96e]/5 border border-[#c8a96e]/15 shadow-2xl">
          <svg width="42" height="42" viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg" fill="none">
            <defs>
              <linearGradient id="mon-silver" x1="40" y1="40" x2="170" y2="340" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#F3F3F3" />
                <stop offset="75%" stopColor="#DADADA" />
                <stop offset="100%" stopColor="#BABABA" />
              </linearGradient>
              <linearGradient id="mon-gold" x1="250" y1="20" x2="390" y2="380" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFF2C3" />
                <stop offset="18%" stopColor="#E9C86E" />
                <stop offset="38%" stopColor="#C99537" />
                <stop offset="55%" stopColor="#B98128" />
                <stop offset="80%" stopColor="#E0B85A" />
                <stop offset="100%" stopColor="#8C6120" />
              </linearGradient>
            </defs>
            <path fill="url(#mon-silver)" d="M122 72 C148 72 168 88 168 115 L168 278 C168 345 131 385 83 385 C49 385 26 365 26 337 C26 312 45 293 69 293 C92 293 109 308 109 329 C109 342 102 352 92 360 C98 362 106 363 116 363 C143 363 152 335 152 289 L152 118 C152 92 139 84 122 82 Z"/>
            <rect x="122" y="66" width="70" height="6" rx="3" fill="url(#mon-silver)"/>
            <path fill="url(#mon-gold)" d="M218 66 L218 72 L275 72 C355 72 394 121 394 210 C394 299 355 348 275 348 L218 348 L218 354 L280 354 C374 354 414 300 414 210 C414 120 374 66 280 66 Z"/>
            <rect x="218" y="66" width="58" height="4" fill="url(#mon-gold)"/>
            <rect x="218" y="350" width="58" height="4" fill="url(#mon-gold)"/>
          </svg>
        </div>

        {/* Status card */}
        <div className="w-full bg-white/[0.02] border border-white/[0.08] rounded-[24px] p-6 backdrop-blur-xl shadow-2xl mb-5">
          <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-semibold tracking-wider uppercase mb-4">
            Connection Lost
          </span>
          <h1 className="font-display text-xl font-bold tracking-tight text-white mb-2">
            You&apos;re Offline
          </h1>
          <p className="text-white/50 text-sm leading-relaxed mb-4">
            We&apos;ll bring you back the instant your connection is restored. Meanwhile, enjoy a game!
          </p>
          <div className="flex items-center justify-center gap-2 text-[#c8a96e] text-xs font-semibold uppercase tracking-widest animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#c8a96e]" />
            Reconnecting...
          </div>
        </div>

        {/* Game */}
        <JDGemCrush />

        <div className="text-white/40 text-xs mt-5 leading-relaxed">
          Need support? Contact us on WhatsApp at<br />
          <a href="https://wa.me/919360490974" target="_blank" rel="noopener noreferrer" className="text-[#c8a96e] font-medium hover:underline">
            +91 9360490974
          </a>
        </div>
      </div>
    </div>
  );
}
