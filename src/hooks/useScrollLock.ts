import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;

    // Pause Lenis smooth scrolling if active
    window.dispatchEvent(new Event('pause-scroll'));

    const originalBody = document.body.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Use standard overflow hidden on body to lock native scroll
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      window.dispatchEvent(new Event('resume-scroll'));
      document.body.style.overflow = originalBody;
      document.body.style.paddingRight = '';
    };
  }, [isLocked]);
}
