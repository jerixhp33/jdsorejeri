import { useCallback } from 'react';
import { ProductFormData } from '../types';
import { DEFAULT_FORM_DATA } from '../constants';
import { useUndoRedo } from './useUndoRedo';

export function useProductForm(initialData?: ProductFormData | null) {
  const { state: formData, setState: setFormData, undo, redo, canUndo, canRedo } = useUndoRedo<ProductFormData>(initialData || DEFAULT_FORM_DATA, 50);

  const updateField = useCallback(<K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  const updateAttribute = useCallback((key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value
      }
    }));
  }, [setFormData]);

  const removeAttribute = useCallback((key: string) => {
    setFormData(prev => {
      const newAttrs = { ...prev.attributes };
      delete newAttrs[key];
      return { ...prev, attributes: newAttrs };
    });
  }, [setFormData]);

  return {
    formData,
    setFormData,
    updateField,
    updateAttribute,
    removeAttribute,
    undo,
    redo,
    canUndo,
    canRedo
  };
}
