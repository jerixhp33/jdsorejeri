import { useState, useCallback, useRef } from 'react';

export function useUndoRedo<T>(initialState: T, maxHistory = 50) {
  const [state, setState] = useState<T>(initialState);
  
  const historyRef = useRef<T[]>([initialState]);
  const pointerRef = useRef<number>(0);
  const isUndoRedoRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setWithHistory = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const nextState = typeof value === 'function' ? (value as Function)(prev) : value;
      
      // If the change came from an undo/redo action, don't add to history again
      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false;
        return nextState;
      }

      // Group rapid typing into a single history state
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const history = historyRef.current;
        const currentPointer = pointerRef.current;
        
        // Discard any future states if we are rewriting history
        const newHistory = history.slice(0, currentPointer + 1);
        newHistory.push(nextState);
        
        if (newHistory.length > maxHistory) {
          newHistory.shift();
        } else {
          pointerRef.current++;
        }
        
        historyRef.current = newHistory;
      }, 500);

      return nextState;
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    if (pointerRef.current > 0) {
      isUndoRedoRef.current = true;
      pointerRef.current--;
      setState(historyRef.current[pointerRef.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (pointerRef.current < historyRef.current.length - 1) {
      isUndoRedoRef.current = true;
      pointerRef.current++;
      setState(historyRef.current[pointerRef.current]);
    }
  }, []);

  return { state, setState: setWithHistory, undo, redo, canUndo: pointerRef.current > 0, canRedo: pointerRef.current < historyRef.current.length - 1 };
}
