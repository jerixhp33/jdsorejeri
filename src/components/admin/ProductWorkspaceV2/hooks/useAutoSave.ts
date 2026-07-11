import { useEffect, useRef, useState } from 'react';
import { ProductFormData } from '../types';

export function useAutoSave(
  formData: ProductFormData, 
  saveAction: (data: ProductFormData) => Promise<void>,
  delayMs = 15000 // 15 seconds debounce
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  
  // Track if we have unsaved changes since last manual/auto save
  const hasUnsavedChanges = useRef(false);
  
  // Track initial mount to prevent saving on first render
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    hasUnsavedChanges.current = true;

    const timer = setTimeout(async () => {
      if (hasUnsavedChanges.current) {
        setIsSaving(true);
        try {
          await saveAction({ ...formData, status: 'draft' });
          setLastSavedTime(new Date());
          hasUnsavedChanges.current = false;
        } catch (err) {
          console.error('Autosave failed:', err);
        } finally {
          setIsSaving(false);
        }
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [formData, saveAction, delayMs]);

  return {
    isSaving,
    lastSavedTime,
    hasUnsavedChanges: hasUnsavedChanges.current
  };
}
