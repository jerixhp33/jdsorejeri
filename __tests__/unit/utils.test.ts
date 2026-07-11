import { describe, it, expect } from 'vitest';
import { calculateDeliveryCharge, formatCurrency, cn } from '@/lib/utils';

describe('Utils & Business Logic', () => {
  describe('calculateDeliveryCharge()', () => {
    it('applies delivery charge for orders under threshold', () => {
      expect(calculateDeliveryCharge(500)).toBe(60); // assuming 60 is the hardcoded charge
    });

    it('waives delivery charge for orders above threshold', () => {
      expect(calculateDeliveryCharge(1000)).toBe(0);
      expect(calculateDeliveryCharge(999)).toBe(0);
    });
  });

  describe('formatCurrency()', () => {
    it('formats numbers to INR currency string', () => {
      expect(formatCurrency(1500)).toBe('₹1,500');
    });

    it('handles zero correctly', () => {
      expect(formatCurrency(0)).toBe('₹0');
    });
  });

  describe('cn() (Tailwind class merging)', () => {
    it('merges multiple classes', () => {
      const result = cn('base-class', 'conditional-class', { 'active': true, 'inactive': false });
      expect(result).toBe('base-class conditional-class active');
    });
  });
});
