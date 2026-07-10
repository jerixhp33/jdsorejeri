'use client';

import { useEffect } from 'react';

export function ContextMenuBlocker() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      
      // Walk up the DOM tree to see if the right-click/long-press happened on an image or a link
      while (target && target !== document.body) {
        if (target.tagName === 'A' || target.tagName === 'IMG') {
          // Prevent the native browser context menu (e.g. "Save Image", "Copy Link")
          e.preventDefault();
          return;
        }
        target = target.parentElement;
      }
    };

    // Use capturing phase to ensure we intercept it before any default behavior
    document.addEventListener('contextmenu', handleContextMenu, true);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, []);

  return null;
}
