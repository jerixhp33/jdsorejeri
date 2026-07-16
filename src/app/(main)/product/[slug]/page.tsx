export const revalidate = 60;

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug, getRelatedProducts } from '@/lib/products';
import { ProductDetail } from '@/components/product/ProductDetail';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { createClient } from '@/lib/supabase/server';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const primaryImage = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url;

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: primaryImage ? [{ url: primaryImage }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Track product view — NON-BLOCKING (don't await, so page renders instantly)
  void supabase.from('analytics_events').insert({
    event_type: 'product_view',
    event_data: { product_id: product.id, product_type: product.product_type },
    page: `/product/${slug}`,
  });

  // Fetch reviews and related products in parallel (single reviews fetch, not double)
  const [{ data: productReviews }, relatedProducts] = await Promise.all([
    supabase
      .from('reviews')
      .select('*, user:user_profiles(name, profile_picture)')
      .eq('product_id', product.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20),
    getRelatedProducts(product.id, product.category_id, 4, product.product_type),
  ]);

  return (
    <>
      <ProductDetail product={product} reviews={productReviews || []} />
      <RelatedProducts products={relatedProducts} />
    </>
  );
}