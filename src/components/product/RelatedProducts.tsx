import { ProductCard } from './ProductCard';
import type { Product } from '@/types';

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products.length) return null;

  return (
    <section className="border-t border-white/10 py-16">
      <div className="page-container">
        <h2 className="font-display text-2xl font-bold text-white mb-8">You may also like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-start">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
