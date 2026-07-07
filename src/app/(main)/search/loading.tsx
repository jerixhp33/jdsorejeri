import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';

export default function SearchLoading() {
  return (
    <div className="page-container py-10 md:py-16">
      <div className="flex flex-col items-center justify-center mb-10 md:mb-16 animate-pulse">
        <div className="h-4 w-32 bg-white/5 rounded mb-4"></div>
        <div className="h-10 w-64 max-w-[80vw] bg-white/5 rounded-lg"></div>
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  );
}
