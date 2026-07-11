import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    // Disabling body scroll lock because it breaks Windows Precision Trackpads 
    // in Chromium browsers. We rely on 'overscroll-contain' in modals instead.
    return;
  }, [isLocked]);
}
