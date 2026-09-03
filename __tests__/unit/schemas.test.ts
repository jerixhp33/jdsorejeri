import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validatePincode } from '@/lib/utils';

// Helper for productSchema
const toOptionalNumber = (val: unknown): number | undefined => {
  if (val === '' || val === null || val === undefined) return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
};

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  short_description: z.string().optional(),
  brand: z.string().default('JD Store'),
  product_type: z.string().min(1),
  category_id: z.string().min(1, 'Select a category'),
  
  // Pricing
  original_price: z.preprocess(toOptionalNumber, z.number().optional()),
  cost_price: z.preprocess(toOptionalNumber, z.number().optional()),
  price: z.preprocess(toOptionalNumber, z.number().min(0, 'Selling Price is required').optional()),
  discount_percent: z.preprocess(toOptionalNumber, z.number().optional()),
  tax_percent: z.preprocess(toOptionalNumber, z.number().optional()),

  // Inventory & Shipping
  stock: z.preprocess(toOptionalNumber, z.number().min(0).optional()),
  low_stock_alert: z.preprocess(toOptionalNumber, z.number().optional()),
  continue_selling_oos: z.boolean().default(false),
  status: z.enum(['active', 'draft', 'out_of_stock', 'archived']).default('active'),
  length_cm: z.preprocess(toOptionalNumber, z.number().optional()),
  width_cm: z.preprocess(toOptionalNumber, z.number().optional()),
  height_cm: z.preprocess(toOptionalNumber, z.number().optional()),
  weight_grams: z.preprocess(toOptionalNumber, z.number().optional()),
  courier_category: z.string().optional(),
  is_free_shipping: z.boolean().default(false),
  sku: z.string().optional(),

  // SEO & Marketing
  tags: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),

  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  is_limited_edition: z.boolean().default(false),
  bundle_product_id: z.string().optional().nullable(),
  slug: z.string().optional(),
});

const checkoutSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  alternate_phone: z.string().optional().refine(
    (val) => !val || /^[6-9]\d{9}$/.test(val), 'Enter a valid mobile number'
  ),
  email: z.string().email('Enter a valid email'),
  house_no: z.string().min(1, 'House/flat number is required'),
  street: z.string().min(3, 'Street is required'),
  area: z.string().min(2, 'Area is required'),
  city: z.string().min(2, 'City is required'),
  district: z.string().min(1, 'Please select a district'),
  pincode: z.string().refine(validatePincode, 'Enter a valid 6-digit pincode'),
  landmark: z.string().optional(),
  delivery_notes: z.string().optional(),
  delivery_instructions: z.string().optional(),
  is_gift: z.boolean().optional(),
  gift_message: z.string().optional(),
});

describe('Zod Schemas', () => {
  describe('productSchema', () => {
    it('validates complete correct data', () => {
      const validData = {
        name: 'Test Product',
        description: 'This is a long enough description.',
        product_type: 'poster',
        category_id: 'cat_1',
        price: '500',
      };
      const result = productSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(500);
        expect(result.data.brand).toBe('JD Store');
        expect(result.data.is_active).toBe(true);
      }
    });

    it('fails when required fields are missing or invalid', () => {
      const invalidData = {
        name: 'A', // too short
        description: 'short', // too short
        product_type: '',
      };
      const result = productSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.name?._errors).toContain('Name must be at least 2 characters');
        expect(errors.description?._errors).toContain('Description must be at least 10 characters');
      }
    });
  });

  describe('checkoutSchema', () => {
    it('validates complete correct checkout data', () => {
      const validData = {
        full_name: 'John Doe',
        phone: '9876543210',
        email: 'john@example.com',
        house_no: '123',
        street: 'Main Street',
        area: 'Downtown',
        city: 'Chennai',
        district: 'Chennai',
        pincode: '600001',
      };
      const result = checkoutSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('fails on invalid phone, pincode, and missing required fields', () => {
      const invalidData = {
        full_name: 'J', // too short
        phone: '123', // invalid phone
        email: 'invalid-email',
        pincode: '123', // invalid pincode
        house_no: '',
        street: '',
        area: '',
        city: '',
        district: '',
      };
      const result = checkoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.full_name?._errors).toContain('Name must be at least 2 characters');
        expect(errors.phone?._errors).toContain('Enter a valid 10-digit mobile number');
        expect(errors.email?._errors).toContain('Enter a valid email');
        expect(errors.pincode?._errors).toContain('Enter a valid 6-digit pincode');
      }
    });
  });
});
