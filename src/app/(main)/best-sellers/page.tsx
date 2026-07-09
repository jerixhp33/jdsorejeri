import { Suspense } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function BestSellersPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_best_seller', true)
    .order('created_at', { ascending: false });

  return (
    <div className="pt-24 sm:pt-32 pb-20 page-container min-h-screen">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
          Best Sellers
        </h1>
        <p className="text-white/60 text-lg">
          Discover our most popular products, loved by our community.
        </p>
      </div>
      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 items-start">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-white/50">
            No best sellers found at the moment.
          </div>
        )}
      </Suspense>
    </div>
  );
}
