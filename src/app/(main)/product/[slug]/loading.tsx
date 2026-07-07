import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';

export default function ProductLoading() {
  return (
    <div className="page-container py-10 md:py-16 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image Skeleton */}
        <div className="space-y-4">
          <div className="w-full aspect-[4/5] bg-white/5 rounded-2xl"></div>
          <div className="flex gap-3 overflow-x-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-xl"></div>
            ))}
          </div>
        </div>

        {/* Info Skeleton */}
        <div className="flex flex-col">
          <div className="w-16 h-4 bg-white/5 rounded mb-5"></div>
          <div className="flex gap-2 mb-4">
            <div className="w-20 h-6 bg-white/5 rounded-full"></div>
            <div className="w-16 h-6 bg-white/5 rounded-full"></div>
          </div>
          
          <div className="w-3/4 h-10 bg-white/5 rounded-lg mb-3"></div>
          <div className="w-32 h-6 bg-white/5 rounded mb-5"></div>
          <div className="w-24 h-8 bg-white/5 rounded mb-6"></div>
          
          <div className="space-y-2 mb-8">
            <div className="w-full h-4 bg-white/5 rounded"></div>
            <div className="w-full h-4 bg-white/5 rounded"></div>
            <div className="w-2/3 h-4 bg-white/5 rounded"></div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl"></div>
            ))}
          </div>

          <div className="flex gap-3 mb-8">
            <div className="w-32 h-12 bg-white/5 rounded-xl"></div>
            <div className="flex-1 h-12 bg-white/5 rounded-xl"></div>
          </div>
        </div>
      </div>

      {/* Related Products Skeleton */}
      <div className="mt-20 md:mt-32 border-t border-white/10 pt-16 md:pt-24">
        <div className="flex flex-col items-center justify-center mb-10 md:mb-16">
          <div className="h-10 w-64 bg-white/5 rounded-lg mb-4"></div>
          <div className="h-4 w-48 bg-white/5 rounded"></div>
        </div>
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
