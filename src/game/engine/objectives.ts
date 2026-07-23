import { GemColor } from './types';
import { ObstacleType } from './obstacles';

export type ObjectiveType = 'score' | 'collect' | 'clear_obstacle';

export interface ObjectiveDef {
  type: ObjectiveType;
  targetAmount: number;
  // Specific to 'collect'
  color?: GemColor;
  // Specific to 'clear_obstacle'
  obstacleType?: ObstacleType;
}

export interface ObjectiveProgress extends ObjectiveDef {
  currentAmount: number;
  completed: boolean;
}

export function initializeObjectives(defs: ObjectiveDef[]): ObjectiveProgress[] {
  return defs.map(def => ({
    ...def,
    currentAmount: 0,
    completed: false
  }));
}

export function updateObjectives(
  progresses: ObjectiveProgress[], 
  events: { type: 'score' | 'collect' | 'clear_obstacle', amount: number, color?: GemColor, obstacleType?: ObstacleType }[]
): ObjectiveProgress[] {
  
  const updated = progresses.map(p => ({ ...p }));

  for (const event of events) {
    for (const obj of updated) {
      if (obj.completed) continue;

      if (obj.type === event.type) {
        if (obj.type === 'score') {
          obj.currentAmount += event.amount;
        } else if (obj.type === 'collect' && obj.color === event.color) {
          obj.currentAmount += event.amount;
        } else if (obj.type === 'clear_obstacle' && obj.obstacleType === event.obstacleType) {
          obj.currentAmount += event.amount;
        }

        if (obj.currentAmount >= obj.targetAmount) {
          obj.currentAmount = obj.targetAmount; // Cap it
          obj.completed = true;
        }
      }
    }
  }

  return updated;
}

export function allObjectivesComplete(progresses: ObjectiveProgress[]): boolean {
  if (progresses.length === 0) return true; // Legacy levels only have score target, handled externally
  return progresses.every(p => p.completed);
}
