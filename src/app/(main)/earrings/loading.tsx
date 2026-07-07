import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';

export default function EarringsLoading() {
  return (
    <div className="page-container py-10 md:py-16">
      <div className="flex flex-col items-center justify-center mb-10 md:mb-16 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-lg mb-4"></div>
        <div className="h-4 w-72 max-w-[80vw] bg-white/5 rounded"></div>
      </div>
      <ProductGridSkeleton count={12} />
    </div>
  );
}
