import { cn } from '@/lib/utils';

interface CollectionGridSkeletonProps {
  count?: number;
  className?: string;
}

export function CollectionGridSkeleton({ count = 8, className }: CollectionGridSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="group relative aspect-square overflow-hidden rounded-[2rem] glass-card border border-white/10">
          <div className="absolute inset-0 skeleton-shimmer bg-white/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4 sm:p-6 z-10">
            <div className="w-full">
              <div className="h-5 sm:h-6 w-32 skeleton rounded bg-white/10 mb-2" />
              <div className="h-3 w-20 skeleton rounded bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
