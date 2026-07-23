import { Cell, GemColor, Pos, SpecialType } from './types';
import { COLS, ROWS } from './constants';
import { inBounds } from './grid';
import { MatchLine, findMatchLines } from './match';

export interface SpecialCreation {
  pos: Pos;
  special: SpecialType;
  color: GemColor;
}

export function analyzeMatches(g: Cell[][], swapPos?: Pos): { toRemove: Set<string>; specials: SpecialCreation[] } {
  const lines = findMatchLines(g);
  const toRemove = new Set<string>();
  const specials: SpecialCreation[] = [];
  const usedInSpecial = new Set<string>();

  const cellToLines = new Map<string, MatchLine[]>();
  for (const line of lines) {
    for (const p of line.cells) {
      const key = `${p.r},${p.c}`;
      toRemove.add(key);
      if (!cellToLines.has(key)) cellToLines.set(key, []);
      cellToLines.get(key)!.push(line);
    }
  }

  // 1. Wrapped (L/T shapes)
  for (const [key, cellLines] of cellToLines) {
    const hasH = cellLines.some(l => l.dir === 'h');
    const hasV = cellLines.some(l => l.dir === 'v');
    if (hasH && hasV) {
      const [r, c] = key.split(',').map(Number);
      specials.push({ pos: { r, c }, special: 'wrapped', color: g[r][c].color });
      usedInSpecial.add(key);
    }
  }

  // 2. Color Bomb (5+)
  for (const line of lines) {
    if (line.cells.length >= 5) {
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

  // 3. Striped (4)
  for (const line of lines) {
    if (line.cells.length === 4) {
      let pos = line.cells[1];
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

export function activateSpecials(g: Cell[][], toRemove: Set<string>): Set<string> {
  const result = new Set(toRemove);
  const activated = new Set<string>();
  const queue: string[] = [];

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

export function handleSpecialCombo(g: Cell[][], a: Pos, b: Pos): Set<string> | null {
  const ca = g[a.r][a.c];
  const cb = g[b.r][b.c];
  
  if (ca.special === 'none' && cb.special === 'none') return null;

  // Bomb + Bomb
  if (ca.special === 'bomb' && cb.special === 'bomb') {
    const all = new Set<string>();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) all.add(`${r},${c}`);
    return all;
  }

  // Bomb + Anything
  if (ca.special === 'bomb' || cb.special === 'bomb') {
    const bomb = ca.special === 'bomb' ? a : b;
    const other = ca.special === 'bomb' ? b : a;
    const otherCell = g[other.r][other.c];
    const result = new Set<string>();
    result.add(`${bomb.r},${bomb.c}`);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (g[r][c].color === otherCell.color) {
          result.add(`${r},${c}`);
          // If the other was a special, turn all of that color into that special first
          // (This logic will be handled better in the main game loop, but for now we just clear them)
        }
      }
    }
    return activateSpecials(g, result);
  }

  // Striped + Striped
  if ((ca.special === 'striped_h' || ca.special === 'striped_v') &&
      (cb.special === 'striped_h' || cb.special === 'striped_v')) {
    const result = new Set<string>();
    for (let cc = 0; cc < COLS; cc++) { result.add(`${a.r},${cc}`); result.add(`${b.r},${cc}`); }
    for (let rr = 0; rr < ROWS; rr++) { result.add(`${rr},${a.c}`); result.add(`${rr},${b.c}`); }
    return activateSpecials(g, result);
  }

  // Wrapped + Wrapped
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

  // Striped + Wrapped
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

  return null;
}
