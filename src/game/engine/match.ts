import { Cell, Pos } from './types';
import { COLS, ROWS } from './constants';
import { cloneGrid, swapInGrid } from './grid';

export interface MatchLine {
  cells: Pos[];
  dir: 'h' | 'v';
}

export function findMatchLines(g: Cell[][]): MatchLine[] {
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

export function hasAnyMatch(g: Cell[][]): boolean {
  return findMatchLines(g).length > 0;
}

export function anyValidMove(grid: Cell[][]): boolean {
  return findHintMove(grid) !== null;
}

export function findHintMove(grid: Cell[][]): [Pos, Pos] | null {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c < COLS - 1) {
        const sw = swapInGrid(grid, { r, c }, { r, c: c + 1 });
        if (hasAnyMatch(sw)) return [{ r, c }, { r, c: c + 1 }];
      }
      if (r < ROWS - 1) {
        const sw = swapInGrid(grid, { r, c }, { r: r + 1, c });
        if (hasAnyMatch(sw)) return [{ r, c }, { r: r + 1, c }];
      }
    }
  }
  return null;
}
