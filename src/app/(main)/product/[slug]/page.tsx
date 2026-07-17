export const revalidate = 60;

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug, getRelatedProducts, getProductById } from '@/lib/products';
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jdstorejeri.vercel.app';

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: {
      canonical: `${baseUrl}/product/${slug}`,
    },
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

  // Fetch reviews, related products, and bundle product in parallel
  const [{ data: productReviews }, relatedProducts, bundleProduct] = await Promise.all([
    supabase
      .from('reviews')
      .select('*, user:user_profiles(name, profile_picture)')
      .eq('product_id', product.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20),
    getRelatedProducts(product.id, product.category_id, 4, product.product_type),
    product.bundle_product_id ? getProductById(product.bundle_product_id) : Promise.resolve(null),
  ]);

  const displayPrice = product.product_type !== 'poster' 
    ? (product.price || 0) 
    : (product.sizes?.[0]?.price || 0);

  const isAvailable = product.product_type !== 'poster'
    ? (product.stock || 0) > 0
    : (product.sizes?.some(s => s.stock > 0));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.map((img: any) => img.url) || [],
    description: product.description,
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`,
      priceCurrency: 'INR',
      price: displayPrice,
      availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} reviews={productReviews || []} initialBundleProduct={bundleProduct} />
      <RelatedProducts products={relatedProducts} />
    </>
  );
}