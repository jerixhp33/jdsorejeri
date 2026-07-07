export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsPage } from '@/components/product/ProductsPage';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';

export const metadata: Metadata = {
  title: 'Earrings',
  description: 'Explore our handcrafted artisan earrings. Each piece is unique, crafted with premium materials.',
};

export default function EarringsPage() {
  return (
    <Suspense fallback={<div className="page-container py-16"><ProductGridSkeleton count={12} /></div>}>
      <ProductsPage
        productType="earring"
        title="Earrings"
        subtitle="Handcrafted artisan jewelry for every occasion"
      />
    </Suspense>
  );
}
