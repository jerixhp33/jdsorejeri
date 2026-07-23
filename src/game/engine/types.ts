export type GemColor = 0 | 1 | 2 | 3 | 4 | 5;
export type SpecialType = 'none' | 'striped_h' | 'striped_v' | 'wrapped' | 'bomb';
export type Pos = { r: number; c: number };
export type Cell = { color: GemColor; special: SpecialType; id: number; matched: boolean };
export type GameScreen = 'menu' | 'levels' | 'game' | 'store' | 'stats' | 'settings';
export type BoosterType = 'hammer' | 'shuffle' | 'extraMoves';

import { ObjectiveDef } from './objectives';

export interface LevelDef {
  target: number;
  moves: number;
  star2: number;
  star3: number;
  gemCount?: number; 
  objectives?: ObjectiveDef[];
  initialObstacles?: { type: import('./obstacles').ObstacleType, pos: Pos, layers: number }[];
}

export interface SaveData {
  unlockedLevel: number;
  levelStars: Record<number, number>;
  levelBest: Record<number, number>;
  boosters: Record<BoosterType, number>;
  soundOn: boolean;
  totalScore: number;
  coins: number;
  settings: {
    colorBlind: boolean;
    reducedMotion: boolean;
  };
  stats: {
    gemsDestroyed: number;
    obstaclesCleared: number;
    levelsPlayed: number;
  };
  achievements: Record<string, boolean>;
}
