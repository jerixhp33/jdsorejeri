import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;

    const originalBody = document.body.style.overflow;
    
    // Only lock body. Locking html breaks Windows trackpad scrolling in Modals.
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalBody;
    };
  }, [isLocked]);
}
