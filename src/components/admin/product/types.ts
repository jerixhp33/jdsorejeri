export interface VariantOption {
  id: string;
  name: string;
  values: string[];
}

export interface VariantCombination {
  id: string;
  options: Record<string, string>;
  price: number;
  stock: number;
  sku: string;
  image_id?: string;
  is_active: boolean;
}

export type ProductConfiguration = {
  variant_options: VariantOption[];
  variant_combinations: VariantCombination[];
  attributes: Record<string, string>;
};
