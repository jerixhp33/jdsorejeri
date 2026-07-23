import { SaveData } from './types';

export const SAVE_KEY = 'jd_gemcrush_save_v3';

export const DEFAULT_SAVE: SaveData = {
  unlockedLevel: 1,
  levelStars: {},
  levelBest: {},
  boosters: { hammer: 3, shuffle: 2, extraMoves: 1 },
  soundOn: true,
  totalScore: 0,
  coins: 500, // Starter coins
  settings: {
    colorBlind: false,
    reducedMotion: false
  },
  stats: {
    gemsDestroyed: 0,
    obstaclesCleared: 0,
    levelsPlayed: 0
  },
  achievements: {}
};

export function loadSave(): SaveData {
  if (typeof window === 'undefined') return { ...DEFAULT_SAVE, boosters: { ...DEFAULT_SAVE.boosters }, stats: { ...DEFAULT_SAVE.stats }, achievements: { ...DEFAULT_SAVE.achievements } };
  
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { 
        ...DEFAULT_SAVE, 
        ...parsed, 
        boosters: { ...DEFAULT_SAVE.boosters, ...(parsed.boosters || {}) },
        settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings || {}) },
        stats: { ...DEFAULT_SAVE.stats, ...(parsed.stats || {}) },
        achievements: { ...DEFAULT_SAVE.achievements, ...(parsed.achievements || {}) }
      };
    }
  } catch {}
  return { 
    ...DEFAULT_SAVE, 
    boosters: { ...DEFAULT_SAVE.boosters }, 
    settings: { ...DEFAULT_SAVE.settings }, 
    stats: { ...DEFAULT_SAVE.stats }, 
    achievements: { ...DEFAULT_SAVE.achievements } 
  };
}

export function writeSave(data: SaveData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {}
}
