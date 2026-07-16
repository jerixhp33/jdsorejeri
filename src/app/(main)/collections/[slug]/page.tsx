import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';

export const revalidate = 60;

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('collections').select('name, description').eq('slug', slug).single();
  if (!data) return { title: 'Collection Not Found' };
  return { title: data.name, description: data.description || undefined };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch only the collection details immediately for the layout
  const { data: collection } = await supabase
    .from('collections').select('*').eq('slug', slug).eq('is_active', true).single();

  if (!collection) notFound();

  return (
    <div className="page-container py-24 md:py-32 min-h-screen">
      <div className="mb-16 flex flex-col items-center text-center">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground/ border border-foreground/ backdrop-blur-md text-foreground/ hover:text-foreground hover:bg-foreground/ hover:border-foreground/ transition-all text-sm font-medium mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-luxe-accent/10 border border-luxe-accent/20 mb-6">
          <p className="text-luxe-accent text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase">Collection</p>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold mb-6 tracking-tight text-foreground">{collection.name}</h1>
        {collection.description && (
          <p className="text-foreground/ text-base md:text-lg max-w-2xl mx-auto leading-relaxed">{collection.description}</p>
        )}
      </div>

      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        <CollectionProductsData collectionId={collection.id} />
      </Suspense>
    </div>
  );
}

async function CollectionProductsData({ collectionId }: { collectionId: string }) {
  const supabase = await createClient();
  const { data: collectionProducts } = await supabase
    .from('collection_products')
    .select('product_id, display_order, product:products(*, category:product_categories(*), images:product_images(*), sizes:poster_sizes(*))')
    .eq('collection_id', collectionId)
    .order('display_order');

  const products = (collectionProducts || []).map((cp) => cp.product).filter(Boolean);

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-foreground/">No products in this collection yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 items-start">
      {products.map((product: any, i: number) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
