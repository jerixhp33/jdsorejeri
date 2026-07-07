import { cn } from '@/lib/utils';

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
}

export function ProductGridSkeleton({ count = 8, className }: ProductGridSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-luxe-dark border border-white/5">
          <div className="aspect-[3/4] skeleton-shimmer" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-16 skeleton rounded" />
            <div className="h-4 w-full skeleton rounded" />
            <div className="h-4 w-2/3 skeleton rounded" />
            <div className="h-5 w-20 skeleton rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
