import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function BestSellersPage() {
  return (
    <div className="pt-24 sm:pt-32 pb-20 page-container min-h-screen">
      <div className="mb-6">
        <Link prefetch={true} href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors text-sm text-white">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
      </div>
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
          Best Sellers
        </h1>
        <p className="text-white/60 text-lg">
          Discover our most popular products, loved by our community.
        </p>
      </div>
      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        <BestSellersData />
      </Suspense>
    </div>
  );
}

async function BestSellersData() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*, images:product_images(*), category:product_categories(*), sizes:poster_sizes(*)')
    .eq('is_active', true)
    .eq('is_best_seller', true)
    .order('created_at', { ascending: false });

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-20 text-white/50">
        No best sellers found at the moment.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 items-start">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
