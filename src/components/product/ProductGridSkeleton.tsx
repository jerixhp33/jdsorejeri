import { cn } from '@/lib/utils';

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
}

export function ProductGridSkeleton({ count = 8, className }: ProductGridSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[1rem] overflow-hidden bg-black/40 border border-white/5">
          <div className="aspect-[3/4] skeleton-shimmer bg-luxe-gray" />
          <div className="p-3 sm:p-4 flex flex-col justify-between h-[90px] sm:h-[104px]">
            <div className="space-y-2">
              <div className="h-2 w-16 skeleton rounded bg-white/5" />
              <div className="h-3 sm:h-4 w-full skeleton rounded bg-white/5" />
            </div>
            <div className="flex items-center justify-between mt-auto">
              <div className="h-4 sm:h-5 w-20 skeleton rounded bg-white/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
