import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;

    const originalBody = document.body.style.overflow;
    const originalHtml = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalBody;
      document.documentElement.style.overflow = originalHtml;
    };
  }, [isLocked]);
}
