export const revalidate = 60;

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsPage } from '@/components/product/ProductsPage';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import type { ProductType } from '@/types';

type Props = {
  params: Promise<{ type: string }>;
};

// Helper to format the type string into a nice title
function formatTitle(type: string): string {
  if (type === 'hair_clip') return 'Hair Clips';
  return type.charAt(0).toUpperCase() + type.slice(1) + 's';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const title = formatTitle(type);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jdstorejeri.vercel.app';

  return {
    title,
    description: `Browse our collection of premium ${title.toLowerCase()}.`,
    alternates: {
      canonical: `${baseUrl}/category/${type}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { type } = await params;
  const productType = type as ProductType;
  const title = formatTitle(type);

  return (
    <Suspense fallback={<div className="page-container py-16"><ProductGridSkeleton count={12} /></div>}>
      <ProductsPage
        productType={productType}
        title={title}
        subtitle={`Explore our curated collection of ${title.toLowerCase()}`}
      />
    </Suspense>
  );
}
