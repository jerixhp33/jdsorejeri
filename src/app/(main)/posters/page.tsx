export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsPage } from '@/components/product/ProductsPage';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';

export const metadata: Metadata = {
  title: 'Wall Posters',
  description: 'Browse our premium collection of museum-quality wall posters. Available in multiple sizes from A4 to 24×36 inches.',
};

export default function PostersPage() {
  return (
    <Suspense fallback={<div className="page-container py-16"><ProductGridSkeleton count={12} /></div>}>
      <ProductsPage
        productType="poster"
        title="Wall Posters"
        subtitle="Museum-quality prints for walls that tell a story"
      />
    </Suspense>
  );
}
