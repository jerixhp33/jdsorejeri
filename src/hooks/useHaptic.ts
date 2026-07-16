'use client';

import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error';

export function useHaptic() {
  const vibrate = useCallback((pattern: HapticPattern = 'light') => {
    // Check if the browser supports vibration
    if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
      return;
    }

    try {
      switch (pattern) {
        case 'light':
          window.navigator.vibrate(10); // Short, subtle tap
          break;
        case 'medium':
          window.navigator.vibrate(30); // Standard tap
          break;
        case 'heavy':
          window.navigator.vibrate(50); // Heavy tap
          break;
        case 'success':
          window.navigator.vibrate([10, 30, 20]); // Light tap followed by stronger tap
          break;
        case 'error':
          window.navigator.vibrate([30, 40, 30, 40, 30]); // Stutter pattern
          break;
        default:
          window.navigator.vibrate(10);
      }
    } catch (e) {
      // Ignore vibration errors (e.g. permission denied)
    }
  }, []);

  return vibrate;
}
