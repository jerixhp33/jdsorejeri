import { Pos } from './types';

export type ObstacleType = 'ice' | 'chain' | 'crate';

export interface Obstacle {
  id: number;
  type: ObstacleType;
  pos: Pos;
  layers: number;
}

let obstacleUid = 1000;
export const getObstacleUid = () => obstacleUid++;

export function createObstacle(type: ObstacleType, pos: Pos, layers: number): Obstacle {
  return {
    id: getObstacleUid(),
    type,
    pos,
    layers
  };
}

// Check if an obstacle is damaged by an adjacent match
export function damageObstacle(obstacle: Obstacle): Obstacle | null {
  if (obstacle.layers <= 1) return null; // Destroyed
  return { ...obstacle, layers: obstacle.layers - 1 };
}

// Find obstacles adjacent to a given position
export function getAdjacentObstacles(pos: Pos, obstacles: Obstacle[]): Obstacle[] {
  return obstacles.filter(o => 
    (Math.abs(o.pos.r - pos.r) === 1 && o.pos.c === pos.c) ||
    (Math.abs(o.pos.c - pos.c) === 1 && o.pos.r === pos.r)
  );
}
