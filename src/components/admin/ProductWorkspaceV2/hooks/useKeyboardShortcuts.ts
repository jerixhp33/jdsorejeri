import { useEffect } from 'react';

export function useKeyboardShortcuts({
  onSaveDraft,
  onPublish,
  onUndo,
  onRedo
}: {
  onSaveDraft: () => void;
  onPublish: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSaveDraft();
      }
      
      // Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onPublish();
      }
      // Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSaveDraft, onPublish, onUndo, onRedo]);
}
