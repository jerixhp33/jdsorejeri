import { useMemo } from 'react';
import { ProductFormData } from '../types';

export function useProductHealth(formData: ProductFormData) {
  const score = useMemo(() => {
    let total = 0;

    // Images (20%)
    if (formData.images && formData.images.length > 0) total += 20;

    // Price (15%)
    if (formData.price > 0) total += 15;

    // Description (15%)
    if (formData.description && formData.description.length > 20) total += 15;

    // Stock (10%)
    if (formData.stock > 0 || (formData.variant_combinations && formData.variant_combinations.length > 0)) total += 10;

    // SEO (15%)
    if (formData.seo_title && formData.seo_description) total += 15;

    // Attributes (10%)
    if (Object.keys(formData.attributes || {}).length > 0) total += 10;

    // Variants (10%)
    if (formData.variant_options && formData.variant_options.length > 0) total += 10;

    // Category (5%)
    if (formData.category_id) total += 5;

    return Math.min(total, 100);
  }, [formData]);

  return { score };
}
