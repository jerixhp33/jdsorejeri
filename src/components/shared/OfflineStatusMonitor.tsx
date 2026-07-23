'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
type GemColor = 0 | 1 | 2 | 3 | 4 | 5;
type SpecialType = 'none' | 'striped_h' | 'striped_v' | 'wrapped' | 'bomb';
type Pos = { r: number; c: number };
type Cell = { color: GemColor; special: SpecialType; id: number; matched: boolean };
type GameScreen = 'menu' | 'levels' | 'game';
type BoosterType = 'hammer' | 'shuffle' | 'extraMoves';

interface LevelDef {
  target: number;
  moves: number;
  star2: number;
  star3: number;
  gemCount?: number; // limit gem types for easier levels
}

interface SaveData {
  unlockedLevel: number;
  levelStars: Record<number, number>;
  levelBest: Record<number, number>;
  boosters: Record<BoosterType, number>;
  soundOn: boolean;
  totalScore: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const COLS = 8;
const ROWS = 9;
const MAX_GEMS = 6;

// Gem visuals — CSS gradients + symbols for each color
const GEM_STYLES: { bg: string; border: string; glow: string; shadow: string; symbol: string; name: string }[] = [
  { bg: 'linear-gradient(145deg,#ff4757,#c0392b)', border: '#ff6b81', glow: 'rgba(255,71,87,0.5)', shadow: 'rgba(192,57,43,0.6)', symbol: '♥', name: 'Red' },
  { bg: 'linear-gradient(145deg,#ffa502,#e67e22)', border: '#ffbe76', glow: 'rgba(255,165,2,0.5)', shadow: 'rgba(230,126,34,0.6)', symbol: '◆', name: 'Orange' },
  { bg: 'linear-gradient(145deg,#2ed573,#27ae60)', border: '#7bed9f', glow: 'rgba(46,213,115,0.5)', shadow: 'rgba(39,174,96,0.6)', symbol: '●', name: 'Green' },
  { bg: 'linear-gradient(145deg,#3742fa,#2f3542)', border: '#5352ed', glow: 'rgba(55,66,250,0.5)', shadow: 'rgba(47,53,66,0.6)', symbol: '✦', name: 'Blue' },
  { bg: 'linear-gradient(145deg,#e056fd,#8e44ad)', border: '#d980fa', glow: 'rgba(224,86,253,0.5)', shadow: 'rgba(142,68,173,0.6)', symbol: '▲', name: 'Purple' },
  { bg: 'linear-gradient(145deg,#ffd32a,#f9ca24)', border: '#fff200', glow: 'rgba(255,211,42,0.5)', shadow: 'rgba(249,202,36,0.6)', symbol: '★', name: 'Yellow' },
];

const BOMB_BG = 'conic-gradient(from 0deg,#ff4757,#ffa502,#2ed573,#3742fa,#e056fd,#ffd32a,#ff4757)';

// 15 levels across 3 worlds
const LEVELS: LevelDef[] = [
  // World 1: Crystal Caves (1-5)
  { target: 600,  moves: 30, star2: 900,  star3: 1200, gemCount: 5 },
  { target: 900,  moves: 28, star2: 1350, star3: 1800, gemCount: 5 },
  { target: 1200, moves: 26, star2: 1800, star3: 2400 },
  { target: 1500, moves: 25, star2: 2250, star3: 3000 },
  { target: 2000, moves: 24, star2: 3000, star3: 4000 },
  // World 2: Golden Palace (6-10)
  { target: 2200, moves: 23, star2: 3300, star3: 4400 },
  { target: 2600, moves: 22, star2: 3900, star3: 5200 },
  { target: 3000, moves: 22, star2: 4500, star3: 6000 },
  { target: 3500, moves: 20, star2: 5250, star3: 7000 },
  { target: 4000, moves: 20, star2: 6000, star3: 8000 },
  // World 3: Diamond Sky (11-15)
  { target: 4500, moves: 20, star2: 6750, star3: 9000 },
  { target: 5000, moves: 18, star2: 7500, star3: 10000 },
  { target: 5500, moves: 18, star2: 8250, star3: 11000 },
  { target: 6000, moves: 16, star2: 9000, star3: 12000 },
  { target: 7000, moves: 16, star2: 10500, star3: 14000 },
];

const WORLDS = [
  { name: 'Crystal Caves', emoji: '💎', range: [0, 4] as [number, number] },
  { name: 'Golden Palace', emoji: '👑', range: [5, 9] as [number, number] },
  { name: 'Diamond Sky', emoji: '✨', range: [10, 14] as [number, number] },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
class SFX {
  private ctx: AudioContext | null = null;
  enabled = true;
  private ac(): AudioContext {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
  private t(f: number, d: number, type: OscillatorType = 'sine', v = 0.1) {
    if (!this.enabled) return;
    try {
      const c = this.ac(), o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, c.currentTime);
      g.gain.setValueAtTime(v, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + d);
    } catch {}
  }
  swap() { this.t(523, 0.06); setTimeout(() => this.t(659, 0.06), 35); }
  match(combo: number) {
    const b = 523 + combo * 80;
    this.t(b, 0.12, 'sine', 0.12);
    setTimeout(() => this.t(b * 1.25, 0.12, 'sine', 0.12), 50);
    setTimeout(() => this.t(b * 1.5, 0.15, 'triangle', 0.08), 100);
  }
  cascade() { [880, 1100, 1320].forEach((f, i) => setTimeout(() => this.t(f, 0.08, 'triangle', 0.06), i * 45)); }
  special() {
    [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => this.t(f, 0.15, 'sine', 0.1), i * 60));
  }
  bomb() {
    this.t(150, 0.4, 'sawtooth', 0.1);
    setTimeout(() => this.t(100, 0.3, 'square', 0.06), 50);
    [600, 800, 1000, 1200].forEach((f, i) => setTimeout(() => this.t(f, 0.1, 'sine', 0.05), i * 30 + 100));
  }
  fail() { this.t(200, 0.1, 'square', 0.04); setTimeout(() => this.t(160, 0.12, 'square', 0.04), 50); }
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.t(f, 0.25, 'sine', 0.1), i * 90)); }
  lose() { [392, 349, 330, 262].forEach((f, i) => setTimeout(() => this.t(f, 0.3, 'sine', 0.08), i * 120)); }
  booster() { this.t(1047, 0.15, 'sine', 0.1); setTimeout(() => this.t(1318, 0.2, 'sine', 0.1), 80); }
  tap() { this.t(800, 0.03, 'sine', 0.05); }
}
const sfx = new SFX();

// ═══════════════════════════════════════════════════════════════════════════════
// SAVE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
const SAVE_KEY = 'jd_gemcrush_save';
const DEFAULT_SAVE: SaveData = {
  unlockedLevel: 1,
  levelStars: {},
  levelBest: {},
  boosters: { hammer: 3, shuffle: 2, extraMoves: 1 },
  soundOn: true,
  totalScore: 0,
};

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SAVE, ...parsed, boosters: { ...DEFAULT_SAVE.boosters, ...(parsed.boosters || {}) } };
    }
  } catch {}
  return { ...DEFAULT_SAVE, boosters: { ...DEFAULT_SAVE.boosters } };
}

function writeSave(data: SaveData) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRID ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
let uid = 1;
const rngColor = (max = MAX_GEMS): GemColor => Math.floor(Math.random() * max) as GemColor;
const mkCell = (color?: GemColor, special: SpecialType = 'none', max = MAX_GEMS): Cell =>
  ({ color: color ?? rngColor(max), special, id: uid++, matched: false });

function buildGrid(gemCount = MAX_GEMS): Cell[][] {
  const g: Cell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    g[r] = [];
    for (let c = 0; c < COLS; c++) {
      let cell = mkCell(undefined, 'none', gemCount);
      while (
        (c >= 2 && g[r][c - 1].color === cell.color && g[r][c - 2].color === cell.color) ||
        (r >= 2 && g[r - 1][c].color === cell.color && g[r - 2][c].color === cell.color)
      ) cell = mkCell(undefined, 'none', gemCount);
      g[r][c] = cell;
    }
  }
  return g;
}

function cloneGrid(g: Cell[][]): Cell[][] {
  return g.map(row => row.map(c => ({ ...c })));
}

function swapInGrid(g: Cell[][], a: Pos, b: Pos): Cell[][] {
  const n = cloneGrid(g);
  [n[a.r][a.c], n[b.r][b.c]] = [n[b.r][b.c], n[a.r][a.c]];
  return n;
}

const isAdj = (a: Pos, b: Pos) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
const inBounds = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

// ── Match Detection ──
interface MatchLine { cells: Pos[]; dir: 'h' | 'v' }

function findMatchLines(g: Cell[][]): MatchLine[] {
  const lines: MatchLine[] = [];
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    let start = 0;
    for (let c = 1; c <= COLS; c++) {
      if (c < COLS && g[r][c].color === g[r][start].color) continue;
      if (c - start >= 3) {
        const cells: Pos[] = [];
        for (let i = start; i < c; i++) cells.push({ r, c: i });
        lines.push({ cells, dir: 'h' });
      }
      start = c;
    }
  }
  // Vertical
  for (let c = 0; c < COLS; c++) {
    let start = 0;
    for (let r = 1; r <= ROWS; r++) {
      if (r < ROWS && g[r][c].color === g[start][c].color) continue;
      if (r - start >= 3) {
        const cells: Pos[] = [];
        for (let i = start; i < r; i++) cells.push({ r: i, c });
        lines.push({ cells, dir: 'v' });
      }
      start = r;
    }
  }
  return lines;
}

function hasAnyMatch(g: Cell[][]): boolean {
  return findMatchLines(g).length > 0;
}

function anyValidMove(g: Cell[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c + 1 < COLS && hasAnyMatch(swapInGrid(g, { r, c }, { r, c: c + 1 }))) return true;
      if (r + 1 < ROWS && hasAnyMatch(swapInGrid(g, { r, c }, { r: r + 1, c }))) return true;
    }
  }
  return false;
}

// ── Special Gem Detection ──
// Analyze matches and determine what specials to create
interface SpecialCreation { pos: Pos; special: SpecialType; color: GemColor }

function analyzeMatches(g: Cell[][], swapPos?: Pos): { toRemove: Set<string>; specials: SpecialCreation[] } {
  const lines = findMatchLines(g);
  const toRemove = new Set<string>();
  const specials: SpecialCreation[] = [];
  const usedInSpecial = new Set<string>();

  // Map each cell to its match lines
  const cellToLines = new Map<string, MatchLine[]>();
  for (const line of lines) {
    for (const p of line.cells) {
      const key = `${p.r},${p.c}`;
      toRemove.add(key);
      if (!cellToLines.has(key)) cellToLines.set(key, []);
      cellToLines.get(key)!.push(line);
    }
  }

  // 1. Check for L/T shapes (cell in both H and V match) → Wrapped
  for (const [key, cellLines] of cellToLines) {
    const hasH = cellLines.some(l => l.dir === 'h');
    const hasV = cellLines.some(l => l.dir === 'v');
    if (hasH && hasV) {
      const [r, c] = key.split(',').map(Number);
      specials.push({ pos: { r, c }, special: 'wrapped', color: g[r][c].color });
      usedInSpecial.add(key);
    }
  }

  // 2. Check for 5+ in a line → Color Bomb
  for (const line of lines) {
    if (line.cells.length >= 5) {
      // Place at swap position if it's in this line, else at center
      let pos = line.cells[Math.floor(line.cells.length / 2)];
      if (swapPos && line.cells.some(p => p.r === swapPos.r && p.c === swapPos.c)) {
        pos = swapPos;
      }
      const key = `${pos.r},${pos.c}`;
      if (!usedInSpecial.has(key)) {
        specials.push({ pos, special: 'bomb', color: g[pos.r][pos.c].color });
        usedInSpecial.add(key);
      }
    }
  }

  // 3. Check for exactly 4 in a line → Striped
  for (const line of lines) {
    if (line.cells.length === 4) {
      let pos = line.cells[1]; // Place near the swap end
      if (swapPos && line.cells.some(p => p.r === swapPos.r && p.c === swapPos.c)) {
        pos = swapPos;
      }
      const key = `${pos.r},${pos.c}`;
      if (!usedInSpecial.has(key)) {
        const specialDir: SpecialType = line.dir === 'h' ? 'striped_v' : 'striped_h';
        specials.push({ pos, special: specialDir, color: g[pos.r][pos.c].color });
        usedInSpecial.add(key);
      }
    }
  }

  return { toRemove, specials };
}

// ── Special Gem Activation ──
function activateSpecials(g: Cell[][], toRemove: Set<string>): Set<string> {
  const result = new Set(toRemove);
  const activated = new Set<string>();
  const queue: string[] = [];

  // Find specials in the removal set
  for (const key of toRemove) {
    const [r, c] = key.split(',').map(Number);
    if (g[r][c].special !== 'none' && !activated.has(key)) {
      queue.push(key);
      activated.add(key);
    }
  }

  while (queue.length > 0) {
    const key = queue.shift()!;
    const [r, c] = key.split(',').map(Number);
    const cell = g[r][c];

    let affected: Pos[] = [];

    switch (cell.special) {
      case 'striped_h':
        for (let cc = 0; cc < COLS; cc++) affected.push({ r, c: cc });
        break;
      case 'striped_v':
        for (let rr = 0; rr < ROWS; rr++) affected.push({ r: rr, c });
        break;
      case 'wrapped':
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (inBounds(r + dr, c + dc)) affected.push({ r: r + dr, c: c + dc });
          }
        }
        break;
      case 'bomb':
        // Remove all gems of the most common color in removal set (or random)
        const targetColor = cell.color;
        for (let rr = 0; rr < ROWS; rr++) {
          for (let cc = 0; cc < COLS; cc++) {
            if (g[rr][cc].color === targetColor) affected.push({ r: rr, c: cc });
          }
        }
        break;
    }

    for (const p of affected) {
      const pk = `${p.r},${p.c}`;
      result.add(pk);
      if (g[p.r][p.c].special !== 'none' && !activated.has(pk)) {
        queue.push(pk);
        activated.add(pk);
      }
    }
  }

  return result;
}

// ── Special Combo (swapping two specials) ──
function handleSpecialCombo(g: Cell[][], a: Pos, b: Pos): Set<string> | null {
  const ca = g[a.r][a.c];
  const cb = g[b.r][b.c];
  if (ca.special === 'none' && cb.special === 'none') return null;

  // Color Bomb + Color Bomb = clear everything
  if (ca.special === 'bomb' && cb.special === 'bomb') {
    const all = new Set<string>();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) all.add(`${r},${c}`);
    return all;
  }

  // Color Bomb + anything = clear all of that color + activate if special
  if (ca.special === 'bomb' || cb.special === 'bomb') {
    const bomb = ca.special === 'bomb' ? a : b;
    const other = ca.special === 'bomb' ? b : a;
    const otherCell = g[other.r][other.c];
    const result = new Set<string>();
    result.add(`${bomb.r},${bomb.c}`);

    if (otherCell.special !== 'none' && otherCell.special !== 'bomb') {
      // Turn all of that color into that special type, then activate
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (g[r][c].color === otherCell.color) {
            result.add(`${r},${c}`);
          }
        }
      }
    } else {
      // Just clear all of that color
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (g[r][c].color === otherCell.color) result.add(`${r},${c}`);
        }
      }
    }
    return activateSpecials(g, result);
  }

  // Striped + Striped = clear row AND column
  if ((ca.special === 'striped_h' || ca.special === 'striped_v') &&
      (cb.special === 'striped_h' || cb.special === 'striped_v')) {
    const result = new Set<string>();
    for (let cc = 0; cc < COLS; cc++) { result.add(`${a.r},${cc}`); result.add(`${b.r},${cc}`); }
    for (let rr = 0; rr < ROWS; rr++) { result.add(`${rr},${a.c}`); result.add(`${rr},${b.c}`); }
    return activateSpecials(g, result);
  }

  // Wrapped + Wrapped = 5x5 explosion
  if (ca.special === 'wrapped' && cb.special === 'wrapped') {
    const result = new Set<string>();
    const center = a;
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (inBounds(center.r + dr, center.c + dc)) result.add(`${center.r + dr},${center.c + dc}`);
      }
    }
    return activateSpecials(g, result);
  }

  // Striped + Wrapped = clear 3 rows + 3 columns
  if (((ca.special === 'striped_h' || ca.special === 'striped_v') && cb.special === 'wrapped') ||
      (ca.special === 'wrapped' && (cb.special === 'striped_h' || cb.special === 'striped_v'))) {
    const center = ca.special === 'wrapped' ? a : b;
    const result = new Set<string>();
    for (let d = -1; d <= 1; d++) {
      for (let cc = 0; cc < COLS; cc++) if (inBounds(center.r + d, cc)) result.add(`${center.r + d},${cc}`);
      for (let rr = 0; rr < ROWS; rr++) if (inBounds(rr, center.c + d)) result.add(`${rr},${center.c + d}`);
    }
    return activateSpecials(g, result);
  }

  // One special + normal: let the normal match-cascade handle it
  return null;
}

// ── Gravity & Fill ──
function collapseAndFill(g: Cell[][], removed: Set<string>, gemCount = MAX_GEMS): Cell[][] {
  const ng = cloneGrid(g);
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!removed.has(`${r},${c}`)) {
        if (write !== r) ng[write][c] = { ...ng[r][c] };
        write--;
      }
    }
    for (let r = write; r >= 0; r--) {
      ng[r][c] = mkCell(undefined, 'none', gemCount);
    }
  }
  return ng;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════
const GAME_CSS = `
@keyframes gc-float { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(-50px) scale(1.4);opacity:0} }
@keyframes gc-pop { 0%{transform:scale(1);opacity:1} 40%{transform:scale(1.4);opacity:.6} 100%{transform:scale(0);opacity:0} }
@keyframes gc-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
@keyframes gc-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
@keyframes gc-drop { 0%{transform:translateY(-130%);opacity:0} 50%{opacity:1} 70%{transform:translateY(8%)} 100%{transform:translateY(0)} }
@keyframes gc-overlay { 0%{transform:scale(.7);opacity:0} 60%{transform:scale(1.03)} 100%{transform:scale(1);opacity:1} }
@keyframes gc-shine { 0%{left:-100%} 100%{left:200%} }
@keyframes gc-bomb-spin { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
@keyframes gc-stripe-move { 0%{background-position:0 0} 100%{background-position:10px 0} }
@keyframes gc-wrapped-glow { 0%,100%{box-shadow:0 0 4px var(--glow)} 50%{box-shadow:0 0 14px var(--glow), 0 0 24px var(--glow)} }
@keyframes gc-star-pop { 0%{transform:scale(0) rotate(-30deg)} 60%{transform:scale(1.3) rotate(10deg)} 100%{transform:scale(1) rotate(0)} }
@keyframes gc-row-flash { 0%{opacity:0} 50%{opacity:.4} 100%{opacity:0} }
@keyframes gc-combo-bounce { 0%{transform:scale(0)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// GEM RENDERER
// ═══════════════════════════════════════════════════════════════════════════════
function GemVisual({ cell, size, selected, shaking, matched }: {
  cell: Cell; size: number; selected: boolean; shaking: boolean; matched: boolean;
}) {
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
        background: isBomb ? BOMB_BG : s.bg,
        position: 'relative',
        boxShadow: selected
          ? `0 0 0 2.5px ${s.border}, 0 0 16px ${s.glow}, 0 0 28px ${s.glow}`
          : `0 3px 8px ${s.shadow}, inset 0 1px 2px rgba(255,255,255,0.3)`,
        animation: matched ? 'gc-pop .35s ease-in forwards'
          : shaking ? 'gc-shake .35s ease-in-out'
          : selected ? 'gc-pulse .7s ease-in-out infinite'
          : isBomb ? 'gc-bomb-spin 3s linear infinite'
          : isWrapped ? 'gc-wrapped-glow 1.5s ease-in-out infinite' : undefined,
        '--glow': s.glow,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform .15s ease',
        transform: selected ? 'scale(1.08)' : 'scale(1)',
      } as React.CSSProperties}
    >
      {/* Shine highlight */}
      <div style={{
        position: 'absolute', top: '12%', left: '15%', width: '40%', height: '25%',
        borderRadius: '50%', background: 'rgba(255,255,255,0.35)', filter: 'blur(1px)',
        pointerEvents: 'none',
      }} />

      {/* Stripe overlay */}
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

      {/* Wrapped indicator */}
      {isWrapped && (
        <div style={{
          position: 'absolute', inset: 2, borderRadius: 'inherit',
          border: '2px solid rgba(255,255,255,0.5)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Inner symbol */}
      <span style={{
        fontSize: innerSize * 0.38,
        color: isBomb ? '#fff' : 'rgba(255,255,255,0.7)',
        fontWeight: 900,
        textShadow: `0 1px 3px rgba(0,0,0,0.4)`,
        zIndex: 1,
        lineHeight: 1,
        pointerEvents: 'none',
      }}>
        {isBomb ? '💫' : s.symbol}
      </span>

      {/* Animated shine sweep */}
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
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING SCORE POPUP
// ═══════════════════════════════════════════════════════════════════════════════
function FloatText({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  return (
    <div className="pointer-events-none absolute" style={{
      left: x, top: y, transform: 'translate(-50%,-50%)',
      color, fontWeight: 900, fontSize: 14, whiteSpace: 'nowrap',
      textShadow: `0 0 8px ${color}, 0 2px 4px rgba(0,0,0,0.5)`,
      animation: 'gc-float .9s ease-out forwards', zIndex: 200,
    }}>
      {text}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL SELECT SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function LevelSelect({ save, onSelect, onBack }: {
  save: SaveData; onSelect: (lvl: number) => void; onBack: () => void;
}) {
  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-white/50 text-sm hover:text-white transition-colors flex items-center gap-1">
          ← Menu
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Total Stars</span>
          <span className="text-sm font-bold text-[#c8a96e]">
            {Object.values(save.levelStars).reduce((a, b) => a + b, 0)} / {LEVELS.length * 3} ⭐
          </span>
        </div>
      </div>

      {WORLDS.map((world, wi) => (
        <div key={wi} className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{world.emoji}</span>
            <span className="text-sm font-bold text-white/80">{world.name}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: world.range[1] - world.range[0] + 1 }, (_, i) => {
              const lvl = world.range[0] + i + 1;
              const unlocked = lvl <= save.unlockedLevel;
              const stars = save.levelStars[lvl] || 0;
              return (
                <button
                  key={lvl}
                  onClick={() => unlocked && onSelect(lvl)}
                  disabled={!unlocked}
                  className="relative flex flex-col items-center justify-center rounded-xl border transition-all"
                  style={{
                    aspectRatio: '1',
                    background: unlocked
                      ? stars === 3 ? 'linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))'
                      : 'rgba(255,255,255,0.03)'
                      : 'rgba(255,255,255,0.01)',
                    borderColor: unlocked
                      ? stars > 0 ? 'rgba(200,169,110,0.3)' : 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    opacity: unlocked ? 1 : 0.35,
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                  }}
                >
                  {unlocked ? (
                    <>
                      <span className="text-white font-bold text-base leading-none">{lvl}</span>
                      <div className="flex gap-px mt-1">
                        {[1, 2, 3].map(s => (
                          <span key={s} style={{ fontSize: 8, opacity: stars >= s ? 1 : 0.2 }}>⭐</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="text-white/20 text-lg">🔒</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MENU
// ═══════════════════════════════════════════════════════════════════════════════
function MainMenu({ save, onPlay, onContinue }: {
  save: SaveData; onPlay: () => void; onContinue: () => void;
}) {
  const totalStars = Object.values(save.levelStars).reduce((a, b) => a + b, 0);
  return (
    <div className="w-full max-w-[360px] mx-auto text-center">
      <div className="text-5xl mb-3">💎</div>
      <h2
        className="text-2xl font-black mb-1 tracking-tight"
        style={{
          background: 'linear-gradient(90deg, #c8a96e, #f0d78c, #c8a96e)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}
      >
        JD GEM CRUSH
      </h2>
      <p className="text-white/30 text-xs mb-6">Match · Crush · Conquer</p>

      <div className="space-y-2.5 mb-6">
        {save.unlockedLevel > 1 && (
          <button onClick={onContinue}
            className="w-full py-3 rounded-2xl text-sm font-bold text-black active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #c8a96e, #e9c86e)', boxShadow: '0 4px 20px rgba(200,169,110,0.4)' }}
          >
            ▶ Continue Level {save.unlockedLevel}
          </button>
        )}
        <button onClick={onPlay}
          className="w-full py-3 rounded-2xl text-sm font-bold border border-white/10 text-white bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 transition-all"
        >
          🗺️ Level Select
        </button>
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

// ═══════════════════════════════════════════════════════════════════════════════
// GAME SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function GameScreen({ levelNum, save, onSave, onBack }: {
  levelNum: number; save: SaveData; onSave: (s: SaveData) => void; onBack: () => void;
}) {
  const levelDef = LEVELS[levelNum - 1];
  const gemCount = levelDef.gemCount || MAX_GEMS;

  const [grid, setGrid] = useState<Cell[][]>(() => buildGrid(gemCount));
  const [sel, setSel] = useState<Pos | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(levelDef.moves);
  const [combo, setCombo] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'none' | 'win' | 'lose'>('none');
  const [matchedSet, setMatchedSet] = useState<Set<string>>(new Set());
  const [shaking, setShaking] = useState<string | null>(null);
  const [floats, setFloats] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([]);
  const [flashRows, setFlashRows] = useState<Set<number>>(new Set());
  const [flashCols, setFlashCols] = useState<Set<number>>(new Set());
  const [activeBooster, setActiveBooster] = useState<BoosterType | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);
  const scoreRef = useRef(0);
  scoreRef.current = score;

  sfx.enabled = save.soundOn;

  const cellPx = useCallback(() => boardRef.current ? boardRef.current.offsetWidth / COLS : 40, []);

  // ── Show row/col flash for striped gems ──
  const flashEffect = useCallback((removed: Set<string>) => {
    const rows = new Set<number>();
    const cols = new Set<number>();
    for (const key of removed) {
      const [r, c] = key.split(',').map(Number);
      // Check if entire row or column is affected (sign of striped activation)
      let rowCount = 0, colCount = 0;
      for (const k of removed) {
        const [kr, kc] = k.split(',').map(Number);
        if (kr === r) rowCount++;
        if (kc === c) colCount++;
      }
      if (rowCount >= COLS - 1) rows.add(r);
      if (colCount >= ROWS - 1) cols.add(c);
    }
    if (rows.size > 0 || cols.size > 0) {
      setFlashRows(rows);
      setFlashCols(cols);
      setTimeout(() => { setFlashRows(new Set()); setFlashCols(new Set()); }, 400);
    }
  }, []);

  // ── Cascade ──
  const cascade = useCallback(async (g: Cell[][], startCombo: number, swapPos?: Pos) => {
    let cur = cloneGrid(g);
    let c = startCombo;

    while (true) {
      const { toRemove, specials } = analyzeMatches(cur, c === 0 ? swapPos : undefined);
      if (toRemove.size === 0) break;

      c++;
      const fullRemove = activateSpecials(cur, toRemove);

      // Check for special effects (row/col flash)
      flashEffect(fullRemove);

      setMatchedSet(new Set(fullRemove));
      setGrid(cloneGrid(cur));
      if (c > 1) sfx.cascade(); else sfx.match(c);

      // Check if any bomb or striped was activated
      let hadSpecialActivation = false;
      for (const key of fullRemove) {
        const [r, cc] = key.split(',').map(Number);
        if (cur[r][cc].special !== 'none') hadSpecialActivation = true;
      }
      if (hadSpecialActivation) sfx.special();

      const pts = fullRemove.size * 50 * c;
      setScore(s => s + pts);
      setCombo(c);

      // Float score at center of removed area
      const cp = cellPx();
      const positions = Array.from(fullRemove).map(s => { const [r, cc] = s.split(',').map(Number); return { r, c: cc }; });
      const cr = positions.reduce((a, p) => a + p.r, 0) / positions.length;
      const cc2 = positions.reduce((a, p) => a + p.c, 0) / positions.length;
      const mainColor = GEM_STYLES[cur[positions[0].r][positions[0].c].color]?.border || '#fff';
      setFloats(prev => [...prev, {
        id: uid++, x: cc2 * cp + cp / 2, y: cr * cp + cp / 2,
        text: c > 1 ? `🔥${c}x +${pts}` : `+${pts}`, color: mainColor,
      }]);
      setTimeout(() => setFloats(prev => prev.slice(1)), 900);

      await new Promise(r => setTimeout(r, 350));

      // Place special gems
      for (const sp of specials) {
        if (!fullRemove.has(`${sp.pos.r},${sp.pos.c}`) || specials.some(s => s.pos.r === sp.pos.r && s.pos.c === sp.pos.c)) {
          cur[sp.pos.r][sp.pos.c] = { ...cur[sp.pos.r][sp.pos.c], special: sp.special, matched: false };
          fullRemove.delete(`${sp.pos.r},${sp.pos.c}`);
        }
      }

      cur = collapseAndFill(cur, fullRemove, gemCount);
      setMatchedSet(new Set());
      setGrid(cloneGrid(cur));
      await new Promise(r => setTimeout(r, 300));
    }

    setCombo(0);
    return cur;
  }, [cellPx, flashEffect, gemCount]);

  // ── Swap ──
  const doSwap = useCallback(async (a: Pos, b: Pos) => {
    if (busy || result !== 'none') return;
    if (!isAdj(a, b)) return;
    setBusy(true);
    sfx.swap();

    const swapped = swapInGrid(grid, a, b);
    setGrid(swapped);
    await new Promise(r => setTimeout(r, 200));

    // Check for special + special combo
    const comboResult = handleSpecialCombo(swapped, a, b);
    if (comboResult) {
      sfx.bomb();
      setMoves(m => m - 1);
      setSel(null);
      flashEffect(comboResult);
      setMatchedSet(comboResult);
      const pts = comboResult.size * 100;
      setScore(s => s + pts);
      const cp = cellPx();
      setFloats(prev => [...prev, { id: uid++, x: a.c * cp + cp / 2, y: a.r * cp + cp / 2, text: `💥 +${pts}`, color: '#ffd700' }]);
      setTimeout(() => setFloats(prev => prev.slice(1)), 900);
      await new Promise(r => setTimeout(r, 400));

      const filled = collapseAndFill(swapped, comboResult, gemCount);
      setMatchedSet(new Set());
      setGrid(filled);
      await new Promise(r => setTimeout(r, 300));

      const final = await cascade(filled, 1);
      setGrid(final);
      setBusy(false);
      return;
    }

    // Normal match check
    const matches = findMatchLines(swapped);
    if (matches.length === 0) {
      sfx.fail();
      setShaking(`${a.r},${a.c}|${b.r},${b.c}`);
      await new Promise(r => setTimeout(r, 350));
      setShaking(null);
      setGrid(cloneGrid(grid));
      setBusy(false);
      return;
    }

    setMoves(m => m - 1);
    setSel(null);
    const final = await cascade(swapped, 0, a);
    setGrid(final);
    setBusy(false);
  }, [grid, busy, result, cascade, cellPx, flashEffect, gemCount]);

  // ── Tap ──
  const tapCell = useCallback((r: number, c: number) => {
    if (result !== 'none') return;

    // Hammer booster
    if (activeBooster === 'hammer') {
      const ng = cloneGrid(grid);
      const cell = ng[r][c];
      if (cell.special !== 'none') sfx.special();
      else sfx.booster();
      const removed = new Set<string>([`${r},${c}`]);
      const full = activateSpecials(ng, removed);
      setMatchedSet(full);
      setActiveBooster(null);
      const ns = { ...save, boosters: { ...save.boosters, hammer: save.boosters.hammer - 1 } };
      onSave(ns);
      setTimeout(async () => {
        const filled = collapseAndFill(ng, full, gemCount);
        setMatchedSet(new Set());
        setGrid(filled);
        await new Promise(r => setTimeout(r, 250));
        const final = await cascade(filled, 0);
        setGrid(final);
      }, 300);
      return;
    }

    if (busy) return;
    const pos: Pos = { r, c };
    if (!sel) { setSel(pos); sfx.tap(); return; }
    if (sel.r === r && sel.c === c) { setSel(null); return; }
    if (isAdj(sel, pos)) {
      doSwap(sel, pos);
      setSel(null);
    } else {
      setSel(pos);
      sfx.tap();
    }
  }, [sel, busy, result, doSwap, activeBooster, grid, save, onSave, cascade, gemCount]);

  // ── Touch swipe ──
  const onTouchStart = useCallback((r: number, c: number, e: React.TouchEvent) => {
    if (activeBooster === 'hammer') { tapCell(r, c); return; }
    const touch = e.touches[0];
    swipeRef.current = { r, c, x: touch.clientX, y: touch.clientY };
    if (!busy && result === 'none') setSel({ r, c });
  }, [busy, result, activeBooster, tapCell]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeRef.current || busy || result !== 'none') { swipeRef.current = null; return; }
    const touch = e.changedTouches[0];
    const dx = touch.clientX - swipeRef.current.x;
    const dy = touch.clientY - swipeRef.current.y;
    const { r, c } = swipeRef.current;
    swipeRef.current = null;

    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return; // tap handled elsewhere

    let tr: number, tc: number;
    if (Math.abs(dx) > Math.abs(dy)) { tr = r; tc = c + (dx > 0 ? 1 : -1); }
    else { tr = r + (dy > 0 ? 1 : -1); tc = c; }

    if (inBounds(tr, tc)) { setSel(null); doSwap({ r, c }, { r: tr, c: tc }); }
  }, [busy, result, doSwap]);

  // ── Win/Lose check ──
  useEffect(() => {
    if (busy || result !== 'none') return;
    if (score >= levelDef.target) {
      setResult('win');
      sfx.win();
      const stars = score >= levelDef.star3 ? 3 : score >= levelDef.star2 ? 2 : 1;
      const ns = { ...save };
      ns.levelStars[levelNum] = Math.max(ns.levelStars[levelNum] || 0, stars);
      ns.levelBest[levelNum] = Math.max(ns.levelBest[levelNum] || 0, score);
      ns.unlockedLevel = Math.max(ns.unlockedLevel, Math.min(levelNum + 1, LEVELS.length));
      ns.totalScore += score;
      // Bonus booster for 3 stars
      if (stars === 3) {
        const types: BoosterType[] = ['hammer', 'shuffle', 'extraMoves'];
        const bonus = types[Math.floor(Math.random() * types.length)];
        ns.boosters[bonus]++;
      }
      onSave(ns);
    } else if (moves <= 0) {
      setResult('lose');
      sfx.lose();
    } else if (!anyValidMove(grid)) {
      setGrid(buildGrid(gemCount));
    }
  }, [score, moves, grid, busy, result, levelDef, levelNum, save, onSave, gemCount]);

  // ── Boosters ──
  const useShuffle = () => {
    if (save.boosters.shuffle <= 0 || busy || result !== 'none') return;
    sfx.booster();
    setGrid(buildGrid(gemCount));
    const ns = { ...save, boosters: { ...save.boosters, shuffle: save.boosters.shuffle - 1 } };
    onSave(ns);
  };

  const useExtraMoves = () => {
    if (save.boosters.extraMoves <= 0 || busy || result !== 'none') return;
    sfx.booster();
    setMoves(m => m + 5);
    const ns = { ...save, boosters: { ...save.boosters, extraMoves: save.boosters.extraMoves - 1 } };
    onSave(ns);
  };

  const pct = Math.min(100, (score / levelDef.target) * 100);
  const earnedStars = score >= levelDef.star3 ? 3 : score >= levelDef.star2 ? 2 : score >= levelDef.target ? 1 : 0;

  return (
    <div className="w-full max-w-[420px] mx-auto select-none" style={{ touchAction: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} disabled={busy}
          className="text-white/40 text-xs hover:text-white transition-colors disabled:opacity-30">← Back</button>
        <div className="text-center">
          <span className="text-xs font-bold text-[#c8a96e]">Level {levelNum}</span>
          <span className="text-[10px] text-white/30 ml-2">{WORLDS[Math.floor((levelNum - 1) / 5)]?.name}</span>
        </div>
        <button onClick={() => { const ns = { ...save, soundOn: !save.soundOn }; sfx.enabled = !save.soundOn; onSave(ns); }}
          className="text-sm w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-colors">
          {save.soundOn ? '🔊' : '🔇'}
        </button>
      </div>

      {/* Score HUD */}
      <div className="mb-2.5 p-2.5 rounded-2xl border border-white/[0.06]" style={{ background: 'linear-gradient(135deg, rgba(200,169,110,0.05), rgba(10,10,10,0.8))' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Score</p>
              <p className="text-white font-extrabold text-lg leading-none">{score.toLocaleString()}</p>
            </div>
            <div className="w-px h-7 bg-white/10" />
            <div>
              <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Target</p>
              <p className="text-lg font-extrabold leading-none" style={{ color: '#c8a96e' }}>{levelDef.target.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-center px-3 py-1 rounded-xl border border-white/[0.06]" style={{ background: moves <= 5 ? 'rgba(255,23,68,0.08)' : 'rgba(255,255,255,0.02)' }}>
            <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Moves</p>
            <p className={`font-extrabold text-lg leading-none ${moves <= 5 ? 'text-red-400' : 'text-white'}`}>{moves}</p>
          </div>
        </div>
        {/* Progress */}
        <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.04]">
          <div className="h-full rounded-full transition-all duration-500 relative" style={{
            width: `${pct}%`,
            background: pct >= 100 ? 'linear-gradient(90deg,#00e676,#69f0ae)' : 'linear-gradient(90deg,#b8860b,#c8a96e,#e9c86e)',
          }}>
            <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 60%)' }} />
          </div>
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

      {/* Combo */}
      {combo > 1 && (
        <div className="text-center mb-1.5">
          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-black text-black"
            style={{ background: 'linear-gradient(90deg,#c8a96e,#f0d78c,#c8a96e)', animation: 'gc-combo-bounce .3s ease-out', boxShadow: '0 0 16px rgba(200,169,110,0.4)' }}>
            🔥 {combo}x COMBO
          </span>
        </div>
      )}

      {/* Boosters */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {([
          { type: 'hammer' as BoosterType, emoji: '🔨', label: 'Hammer', count: save.boosters.hammer },
          { type: 'shuffle' as BoosterType, emoji: '🔀', label: 'Shuffle', count: save.boosters.shuffle },
          { type: 'extraMoves' as BoosterType, emoji: '➕', label: '+5 Moves', count: save.boosters.extraMoves },
        ]).map(b => (
          <button key={b.type} disabled={b.count <= 0 || (busy && b.type !== 'hammer') || result !== 'none'}
            onClick={() => {
              if (b.type === 'hammer') setActiveBooster(activeBooster === 'hammer' ? null : 'hammer');
              else if (b.type === 'shuffle') useShuffle();
              else useExtraMoves();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all disabled:opacity-30"
            style={{
              background: activeBooster === b.type ? 'rgba(200,169,110,0.15)' : 'rgba(255,255,255,0.02)',
              borderColor: activeBooster === b.type ? 'rgba(200,169,110,0.4)' : 'rgba(255,255,255,0.06)',
              color: activeBooster === b.type ? '#c8a96e' : 'rgba(255,255,255,0.5)',
            }}
          >
            <span className="text-sm">{b.emoji}</span>
            <span>{b.count}</span>
          </button>
        ))}
      </div>

      {activeBooster === 'hammer' && (
        <div className="text-center mb-1.5">
          <span className="text-[10px] text-[#c8a96e] font-semibold animate-pulse">🔨 Tap a gem to destroy it</span>
        </div>
      )}

      {/* ═══ BOARD ═══ */}
      <div ref={boardRef} className="relative w-full rounded-2xl overflow-hidden border-2 border-[#c8a96e]/15"
        style={{
          aspectRatio: `${COLS}/${ROWS}`,
          background: 'linear-gradient(180deg,#1a1510,#0d0b08)',
          boxShadow: '0 0 50px rgba(200,169,110,0.06), inset 0 0 30px rgba(0,0,0,0.5), 0 4px 25px rgba(0,0,0,0.4)',
        }}
      >
        {/* Grid bg */}
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

        {/* Row/col flash effects */}
        {Array.from(flashRows).map(r => (
          <div key={`fr${r}`} className="absolute pointer-events-none" style={{
            left: 0, top: `${(r / ROWS) * 100}%`, width: '100%', height: `${100 / ROWS}%`,
            background: 'rgba(255,255,255,0.15)', animation: 'gc-row-flash .4s ease-out forwards',
          }} />
        ))}
        {Array.from(flashCols).map(c => (
          <div key={`fc${c}`} className="absolute pointer-events-none" style={{
            left: `${(c / COLS) * 100}%`, top: 0, width: `${100 / COLS}%`, height: '100%',
            background: 'rgba(255,255,255,0.15)', animation: 'gc-row-flash .4s ease-out forwards',
          }} />
        ))}

        {/* Gems */}
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isSel = sel?.r === r && sel?.c === c;
            const isMatched = matchedSet.has(`${r},${c}`);
            const isShake = shaking?.includes(`${r},${c}`);
            const wp = 100 / COLS;
            const hp = 100 / ROWS;

            return (
              <div key={cell.id}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${c * wp}%`, top: `${r * hp}%`, width: `${wp}%`, height: `${hp}%`,
                  transition: 'left .2s ease, top .2s ease',
                  zIndex: isSel ? 10 : 1,
                  cursor: activeBooster === 'hammer' ? 'crosshair' : 'pointer',
                }}
                onClick={() => tapCell(r, c)}
                onTouchStart={e => { e.preventDefault(); onTouchStart(r, c, e); }}
                onTouchEnd={e => { e.preventDefault(); onTouchEnd(e); }}
              >
                <GemVisual cell={cell} size={cellPx()} selected={isSel} shaking={!!isShake} matched={isMatched} />
              </div>
            );
          })
        )}

        {/* Floating scores */}
        {floats.map(f => <FloatText key={f.id} x={f.x} y={f.y} text={f.text} color={f.color} />)}

        {/* WIN overlay */}
        {result === 'win' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50">
            <div className="text-center p-5" style={{ animation: 'gc-overlay .5s ease-out forwards' }}>
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {[1, 2, 3].map(s => (
                  <span key={s} className="text-3xl" style={{
                    animation: earnedStars >= s ? `gc-star-pop .4s ease-out ${s * 0.15}s backwards` : undefined,
                    opacity: earnedStars >= s ? 1 : 0.15,
                  }}>⭐</span>
                ))}
              </div>
              <h3 className="text-white font-extrabold text-xl mb-1">Level {levelNum} Complete!</h3>
              <p className="text-sm mb-0.5" style={{ color: '#c8a96e' }}>Score: <strong>{score.toLocaleString()}</strong></p>
              <p className="text-white/30 text-xs mb-4">{moves} moves remaining · Best: {(save.levelBest[levelNum] || 0).toLocaleString()}</p>
              <div className="flex items-center justify-center gap-2">
                <button onClick={onBack}
                  className="px-4 py-2.5 rounded-full text-xs font-bold border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all">
                  🗺️ Levels
                </button>
                {levelNum < LEVELS.length && (
                  <button onClick={() => { setScore(0); setMoves(LEVELS[levelNum]?.moves || 30); setGrid(buildGrid(LEVELS[levelNum]?.gemCount || MAX_GEMS)); setResult('none'); setSel(null); setCombo(0); }}
                    className="px-6 py-2.5 rounded-full text-xs font-bold text-black active:scale-95 transition-transform"
                    style={{ background: 'linear-gradient(135deg,#c8a96e,#e9c86e)', boxShadow: '0 4px 16px rgba(200,169,110,0.4)' }}>
                    Next Level ✨
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LOSE overlay */}
        {result === 'lose' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50">
            <div className="text-center p-5" style={{ animation: 'gc-overlay .5s ease-out forwards' }}>
              <div className="text-4xl mb-2">😢</div>
              <h3 className="text-white font-extrabold text-xl mb-1">Out of Moves!</h3>
              <p className="text-white/40 text-sm mb-1">Score: {score.toLocaleString()} / {levelDef.target.toLocaleString()}</p>
              <p className="text-white/25 text-xs mb-4">So close! Try again.</p>
              <div className="flex items-center justify-center gap-2">
                <button onClick={onBack}
                  className="px-4 py-2.5 rounded-full text-xs font-bold border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all">
                  🗺️ Levels
                </button>
                <button onClick={() => { setScore(0); setMoves(levelDef.moves); setGrid(buildGrid(gemCount)); setResult('none'); setSel(null); setCombo(0); }}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-black active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg,#c8a96e,#e9c86e)', boxShadow: '0 4px 16px rgba(200,169,110,0.4)' }}>
                  🔄 Retry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-white/15 text-[9px] mt-2 font-medium tracking-wider">
        TAP or SWIPE · Match 4 = Striped · L/T = Wrapped · Match 5 = 💫 Bomb
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFFLINE STATUS MONITOR (exported)
// ═══════════════════════════════════════════════════════════════════════════════
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

  return <OfflineGame />;
}

// Separated game wrapper so state doesn't reset on online/offline toggle
function OfflineGame() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [currentLevel, setCurrentLevel] = useState(1);

  const handleSave = useCallback((s: SaveData) => {
    setSave(s);
    writeSave(s);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-start p-4 pt-5 overflow-y-auto">
      <style>{GAME_CSS}</style>
      <div className="absolute w-[350px] h-[350px] rounded-full top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40 animate-pulse"
        style={{ background: 'radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
        {/* Compact offline banner */}
        <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-2xl px-4 py-3 backdrop-blur-xl shadow-xl mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c8a96e]/5 border border-[#c8a96e]/15 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg" fill="none">
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
            <h1 className="text-sm font-bold text-white">You&apos;re Offline</h1>
            <p className="text-white/30 text-[10px]">Auto-reconnecting in background</p>
          </div>
          <div className="flex items-center gap-1.5 text-[#c8a96e] animate-pulse flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8a96e]" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Game Screens */}
        {screen === 'menu' && (
          <MainMenu
            save={save}
            onPlay={() => setScreen('levels')}
            onContinue={() => { setCurrentLevel(save.unlockedLevel); setScreen('game'); }}
          />
        )}

        {screen === 'levels' && (
          <LevelSelect
            save={save}
            onSelect={(lvl) => { setCurrentLevel(lvl); setScreen('game'); }}
            onBack={() => setScreen('menu')}
          />
        )}

        {screen === 'game' && (
          <GameScreen
            key={currentLevel}
            levelNum={currentLevel}
            save={save}
            onSave={handleSave}
            onBack={() => setScreen('levels')}
          />
        )}

        <div className="text-white/25 text-[9px] mt-4 text-center">
          Need help?{' '}
          <a href="https://wa.me/919360490974" target="_blank" rel="noopener noreferrer" className="text-[#c8a96e] font-medium">WhatsApp Us</a>
        </div>
      </div>
    </div>
  );
}
