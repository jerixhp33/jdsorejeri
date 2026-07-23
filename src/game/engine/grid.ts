import { Cell, GemColor, Pos, SpecialType } from './types';
import { COLS, MAX_GEMS, ROWS } from './constants';

let uid = 1;
export const getUid = () => uid++;

export const rngColor = (max = MAX_GEMS): GemColor => Math.floor(Math.random() * max) as GemColor;

export const mkCell = (color?: GemColor, special: SpecialType = 'none', max = MAX_GEMS): Cell =>
  ({ color: color ?? rngColor(max), special, id: getUid(), matched: false });

export function buildGrid(gemCount = MAX_GEMS): Cell[][] {
  const g: Cell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    g[r] = [];
    for (let c = 0; c < COLS; c++) {
      let cell = mkCell(undefined, 'none', gemCount);
      while (
        (c >= 2 && g[r][c - 1].color === cell.color && g[r][c - 2].color === cell.color) ||
        (r >= 2 && g[r - 1][c].color === cell.color && g[r - 2][c].color === cell.color)
      ) {
        cell = mkCell(undefined, 'none', gemCount);
      }
      g[r][c] = cell;
    }
  }
  return g;
}

export function cloneGrid(g: Cell[][]): Cell[][] {
  return g.map(row => row.map(c => ({ ...c })));
}

export function swapInGrid(g: Cell[][], a: Pos, b: Pos): Cell[][] {
  const n = cloneGrid(g);
  [n[a.r][a.c], n[b.r][b.c]] = [n[b.r][b.c], n[a.r][a.c]];
  return n;
}

export const isAdj = (a: Pos, b: Pos) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
export const inBounds = (r: number, c: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

export function collapseAndFill(g: Cell[][], removed: Set<string>, gemCount = MAX_GEMS): Cell[][] {
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
