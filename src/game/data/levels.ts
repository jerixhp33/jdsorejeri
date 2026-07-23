import { LevelDef } from '../engine/types';

// Helper to generate 50 progressive levels
function generateLevels(): LevelDef[] {
  const levels: LevelDef[] = [];
  
  for (let i = 1; i <= 50; i++) {
    const isBoss = i % 10 === 0;
    const isHard = i % 5 === 0 && !isBoss;
    
    // Base difficulty scaling
    const targetScore = 500 + i * 200 + (isHard ? 1000 : 0) + (isBoss ? 2000 : 0);
    const moves = Math.max(15, 30 - Math.floor(i / 3) + (isBoss ? 5 : 0));
    
    // Gems scale from 4 to 6
    let gemCount = 5;
    if (i <= 5) gemCount = 4;
    else if (i >= 30) gemCount = 6;
    
    const objectives: import('../engine/objectives').ObjectiveDef[] = [
      { type: 'score', targetAmount: targetScore }
    ];
    
    const initialObstacles: { type: import('../engine/obstacles').ObstacleType, pos: import('../engine/types').Pos, layers: number }[] = [];
    
    // Add custom objectives and obstacles based on world and level
    if (i >= 3) {
      if (i % 3 === 0) {
        objectives.push({ type: 'collect', color: (i % 6) as import('../engine/types').GemColor, targetAmount: 15 + i });
      }
      if (i % 4 === 0 || isBoss) {
        objectives.push({ type: 'clear_obstacle', obstacleType: 'ice', targetAmount: 4 + Math.floor(i / 5) });
        // Add ice obstacles
        for(let k=0; k < 4 + Math.floor(i / 5); k++) {
          initialObstacles.push({ type: 'ice', pos: { r: 2 + (k % 5), c: 1 + (k % 6) }, layers: i > 20 ? 2 : 1 });
        }
      }
      if (i >= 15 && (i % 5 === 0 || isBoss)) {
        objectives.push({ type: 'clear_obstacle', obstacleType: 'chain', targetAmount: 3 + Math.floor(i / 10) });
        for(let k=0; k < 3 + Math.floor(i / 10); k++) {
          initialObstacles.push({ type: 'chain', pos: { r: 3 + (k % 4), c: 2 + (k % 4) }, layers: 1 });
        }
      }
      if (i >= 25 && (isBoss || isHard)) {
        objectives.push({ type: 'clear_obstacle', obstacleType: 'crate', targetAmount: 4 });
        initialObstacles.push({ type: 'crate', pos: { r: 0, c: 0 }, layers: 2 });
        initialObstacles.push({ type: 'crate', pos: { r: 0, c: 7 }, layers: 2 });
        initialObstacles.push({ type: 'crate', pos: { r: 8, c: 0 }, layers: 2 });
        initialObstacles.push({ type: 'crate', pos: { r: 8, c: 7 }, layers: 2 });
      }
    }

    levels.push({
      target: targetScore,
      moves: moves,
      star2: Math.floor(targetScore * 1.5),
      star3: targetScore * 2,
      gemCount,
      objectives,
      initialObstacles
    });
  }

  // Override first few levels for specific tutorial feel
  levels[0] = { 
    target: 600, moves: 30, star2: 900, star3: 1200, gemCount: 4,
    objectives: [{ type: 'score', targetAmount: 600 }]
  };
  levels[1] = { 
    target: 1000, moves: 28, star2: 1500, star3: 2000, gemCount: 5,
    objectives: [
      { type: 'score', targetAmount: 1000 },
      { type: 'collect', color: 0, targetAmount: 12 }
    ]
  };

  return levels;
}

export const LEVELS: LevelDef[] = generateLevels();
