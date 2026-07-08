export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product/ProductCard';

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

  const { data: collection } = await supabase
    .from('collections').select('*').eq('slug', slug).eq('is_active', true).single();

  if (!collection) notFound();

  const { data: collectionProducts } = await supabase
    .from('collection_products')
    .select('product_id, display_order, product:products(*, category:product_categories(*), images:product_images(*), sizes:poster_sizes(*))')
    .eq('collection_id', collection.id)
    .order('display_order');

  const products = (collectionProducts || []).map((cp) => cp.product).filter(Boolean);

  return (
    <div className="page-container py-10 md:py-16">
      <div className="mb-12">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <p className="text-luxe-accent text-sm tracking-widest uppercase mb-3">Collection</p>
        <h1 className="section-title mb-3">{collection.name}</h1>
        {collection.description && (
          <p className="text-white/50 text-base max-w-xl">{collection.description}</p>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product: any, i: number) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-white/30">No products in this collection yet.</p>
        </div>
      )}
    </div>
  );
}
