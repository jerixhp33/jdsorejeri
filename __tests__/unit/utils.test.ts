import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  calculateDeliveryCharge, formatCurrency, cn,
  validatePincode, validatePhone, generateSlug, generateOrderNumber,
  formatDate, formatRelativeTime, getStarRating, parseDeviceInfo,
  generateSKU, truncate, deepClone, isValidImageUrl, getInitials,
  debounce, generateWhatsAppMessage, TAMIL_NADU_DISTRICTS, CITIES_BY_DISTRICT
} from '@/lib/utils';

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
  describe('validatePincode()', () => {
    it('returns true for valid pincodes', () => {
      expect(validatePincode('110001')).toBe(true);
      expect(validatePincode('600001')).toBe(true);
    });
    it('returns false for invalid pincodes', () => {
      expect(validatePincode('010001')).toBe(false); // starts with 0
      expect(validatePincode('12345')).toBe(false); // too short
      expect(validatePincode('1234567')).toBe(false); // too long
      expect(validatePincode('abcdef')).toBe(false); // letters
    });
  });

  describe('validatePhone()', () => {
    it('returns true for valid 10-digit Indian phones', () => {
      expect(validatePhone('9876543210')).toBe(true);
      expect(validatePhone('6123456789')).toBe(true);
      expect(validatePhone('7000000000')).toBe(true);
      expect(validatePhone('8999999999')).toBe(true);
    });
    it('returns false for invalid phones', () => {
      expect(validatePhone('5123456789')).toBe(false); // starts with 5
      expect(validatePhone('987654321')).toBe(false); // 9 digits
      expect(validatePhone('98765432101')).toBe(false); // 11 digits
    });
  });

  describe('generateSlug()', () => {
    it('generates a clean URL slug', () => {
      expect(generateSlug('Hello World!')).toBe('hello-world');
      expect(generateSlug('  Multiple   Spaces  ')).toBe('-multiple-spaces-');
      expect(generateSlug('Special @#$ Chars')).toBe('special-chars');
      expect(generateSlug('JD Store - New Collection')).toBe('jd-store-new-collection');
    });
  });

  describe('generateOrderNumber()', () => {
    it('generates a string starting with LX', () => {
      const orderNum = generateOrderNumber();
      expect(orderNum.startsWith('LX')).toBe(true);
      expect(orderNum.length).toBeGreaterThan(5);
    });
  });

  describe('formatDate()', () => {
    it('formats valid dates correctly', () => {
      const date = new Date('2024-01-15T10:00:00Z').toISOString();
      const formatted = formatDate(date);
      // Depending on timezone it might be 15 Jan 2024, but we just check if it contains 2024
      expect(formatted).toContain('2024');
    });
    it('handles null, undefined or invalid dates gracefully', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('invalid-date')).toBe('—');
    });
  });

  describe('formatRelativeTime()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "just now" for very recent times', () => {
      const date = new Date('2024-01-01T11:59:30Z').toISOString();
      expect(formatRelativeTime(date)).toBe('just now');
    });
    it('returns "Xm ago" for minutes', () => {
      const date = new Date('2024-01-01T11:50:00Z').toISOString();
      expect(formatRelativeTime(date)).toBe('10m ago');
    });
    it('returns "Xh ago" for hours', () => {
      const date = new Date('2024-01-01T08:00:00Z').toISOString();
      expect(formatRelativeTime(date)).toBe('4h ago');
    });
    it('returns "Xd ago" for days', () => {
      const date = new Date('2023-12-30T12:00:00Z').toISOString();
      expect(formatRelativeTime(date)).toBe('2d ago');
    });
    it('returns formatted date for older dates', () => {
      const date = new Date('2023-12-20T12:00:00Z').toISOString();
      expect(formatRelativeTime(date)).not.toContain('ago');
      expect(formatRelativeTime(date)).toContain('2023');
    });
    it('handles invalid inputs', () => {
      expect(formatRelativeTime(null)).toBe('—');
      expect(formatRelativeTime('invalid')).toBe('—');
    });
  });

  describe('getStarRating()', () => {
    it('returns correct array for integer ratings', () => {
      expect(getStarRating(3)).toEqual([1, 1, 1, 0, 0]);
      expect(getStarRating(5)).toEqual([1, 1, 1, 1, 1]);
    });
    it('returns correct array for fractional ratings', () => {
      expect(getStarRating(3.5)).toEqual([1, 1, 1, 0.5, 0]);
      expect(getStarRating(4.2)).toEqual([1, 1, 1, 1, 0.5]);
    });
  });

  describe('parseDeviceInfo()', () => {
    it('detects desktop and chrome correctly', () => {
      const { device, browser } = parseDeviceInfo('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      expect(device).toBe('Desktop');
      expect(browser).toBe('Chrome');
    });
    it('detects mobile and safari correctly', () => {
      const { device, browser } = parseDeviceInfo('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
      expect(device).toBe('Mobile');
      expect(browser).toBe('Safari');
    });
  });

  describe('generateSKU()', () => {
    it('generates SKU based on product name and variant', () => {
      const sku = generateSKU('Poster Art', 'A4');
      expect(sku).toMatch(/^POSTA4\d{4}$/);
    });
    it('works without variant', () => {
      const sku = generateSKU('Necklace');
      expect(sku).toMatch(/^NECK\d{4}$/);
    });
  });

  describe('truncate()', () => {
    it('truncates text that exceeds max length', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });
    it('does not truncate short text', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });
  });

  describe('deepClone()', () => {
    it('clones objects deeply', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });
  });

  describe('isValidImageUrl()', () => {
    it('returns true for valid image extensions', () => {
      expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true);
      expect(isValidImageUrl('https://example.com/image.PNG')).toBe(true);
    });
    it('returns false for non-image urls', () => {
      expect(isValidImageUrl('https://example.com/file.pdf')).toBe(false);
      expect(isValidImageUrl('not a url')).toBe(false);
    });
  });

  describe('getInitials()', () => {
    it('returns up to 2 initials', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Alice')).toBe('A');
      expect(getInitials('John Robert Doe')).toBe('JR');
    });
  });

  describe('debounce()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });
    it('debounces function calls', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);
      
      debounced();
      debounced();
      debounced();
      
      expect(func).not.toBeCalled();
      vi.advanceTimersByTime(100);
      expect(func).toBeCalledTimes(1);
    });
  });

  describe('generateWhatsAppMessage()', () => {
    it('generates correct message string with all fields', () => {
      const payload = {
        order_number: 'LX123',
        customer_name: 'John',
        phone: '9999999999',
        address: '123 St',
        district: 'Chennai',
        items: [
          { name: 'Poster', size: 'A4', quantity: 2, price: 500 }
        ],
        subtotal: 1000,
        delivery_charge: 0,
        total: 900,
        discount_amount: 100,
        coupon_code: 'SAVE100',
        notes: 'Handle with care'
      };
      const msg = generateWhatsAppMessage(payload);
      expect(msg).toContain('#LX123');
      expect(msg).toContain('John');
      expect(msg).toContain('9999999999');
      expect(msg).toContain('123 St');
      expect(msg).toContain('Chennai');
      expect(msg).toContain('Poster');
      expect(msg).toContain('A4');
      expect(msg).toContain('SAVE100');
      expect(msg).toContain('Handle with care');
    });
    it('generates correct message without optional fields', () => {
      const payload = {
        customer_name: 'Jane',
        phone: '8888888888',
        address: '456 Ave',
        district: 'Madurai',
        items: [
          { name: 'Ring', quantity: 1, price: 300 }
        ],
        subtotal: 300,
        delivery_charge: 60,
        total: 360,
      };
      const msg = generateWhatsAppMessage(payload);
      expect(msg).toContain('PENDING'); // no order number
      expect(msg).toContain('Ring');
      expect(msg).not.toContain('Size:');
      expect(msg).not.toContain('Discount');
      expect(msg).not.toContain('SPECIAL INSTRUCTIONS');
    });
  });

  describe('Constants', () => {
    it('TAMIL_NADU_DISTRICTS has correct count', () => {
      import('@/lib/utils').then(module => {
        expect(module.TAMIL_NADU_DISTRICTS.length).toBe(37);
      });
    });
    it('CITIES_BY_DISTRICT matches some districts', () => {
      import('@/lib/utils').then(module => {
        expect(module.CITIES_BY_DISTRICT['Chennai']).toBeDefined();
        expect(module.CITIES_BY_DISTRICT['Chennai']).toContain('Chennai');
      });
    });
  });
});
