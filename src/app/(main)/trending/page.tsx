import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 120;

export default async function TrendingPage() {
  return (
    <div className="pt-24 sm:pt-32 pb-20 page-container min-h-screen">
      <div className="mb-6">
        <Link prefetch={true} href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/ backdrop-blur-md border border-foreground/ hover:bg-foreground/ transition-colors text-sm text-foreground">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
      </div>
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
          Trending Now
        </h1>
        <p className="text-foreground/ text-lg">
          Discover the hottest products everyone is talking about right now.
        </p>
      </div>
      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        <TrendingData />
      </Suspense>
    </div>
  );
}

async function TrendingData() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*, images:product_images(*), category:product_categories(*), sizes:poster_sizes(*)')
    .eq('is_active', true)
    .eq('is_trending', true)
    .order('created_at', { ascending: false });

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-20 text-foreground/">
        No trending products found at the moment.
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
