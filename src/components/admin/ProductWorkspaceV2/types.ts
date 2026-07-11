import { Product, ProductType, Category, ProductImage } from '@/types';

export interface VariantOption {
  id: string;
  name: string; // e.g. "Color", "Size"
  values: string[]; // e.g. ["Red", "Blue"], ["A4", "A3"]
}

export interface VariantCombination {
  id: string; // unique ID for this combination
  options: Record<string, string>; // e.g. { "Color": "Red", "Size": "A4" }
  price: number;
  stock: number;
  sku: string;
  image_id?: string;
  is_active: boolean;
}

export interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  product_type: ProductType | '';
  category_id: string;
  tags: string[];
  
  // Base pricing & inventory (used if no variants)
  price: number;
  original_price: number;
  cost_price: number;
  stock: number;
  sku: string;
  
  // Status
  status: 'active' | 'draft' | 'archived' | 'out_of_stock';
  is_featured: boolean;
  
  // Shipping
  weight_grams: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  
  // SEO
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  
  // Attributes (Key-Value)
  attributes: Record<string, string>;
  
  // Generic Variants
  variant_options: VariantOption[];
  variant_combinations: VariantCombination[];
  
  // Media
  images: ProductImage[];
}
