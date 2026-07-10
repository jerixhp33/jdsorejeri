'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Ultimate Content Protector
 * Instantly kills all right-click, image drag, copy, and text selection events
 * globally, EXCEPT on the admin routes where the store owner needs full control.
 */
export function ContentProtector() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) {
      document.body.classList.add('admin-route');
      return;
    } else {
      document.body.classList.remove('admin-route');
    }

    const preventDefault = (e: Event) => e.preventDefault();

    // 1. Block right-click (Context Menu)
    document.addEventListener('contextmenu', preventDefault);

    // 2. Block dragging images/elements
    document.addEventListener('dragstart', preventDefault);

    // 3. Block text selection
    document.addEventListener('selectstart', preventDefault);

    // 4. Block copy (Ctrl+C / Cmd+C)
    document.addEventListener('copy', preventDefault);

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('copy', preventDefault);
    };
  }, [isAdmin]);

  return null;
}
