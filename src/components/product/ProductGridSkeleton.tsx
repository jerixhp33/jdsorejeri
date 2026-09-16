import { cn } from '@/lib/utils';

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
}

export function ProductGridSkeleton({ count = 8, className }: ProductGridSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} 
          className="relative rounded-2xl overflow-hidden bg-luxe-card border border-white/10 shadow-lg flex flex-col"
        >
          <div className="aspect-[3/4] lg:aspect-[4/5] bg-white/5 animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
          <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 flex-1">
            <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-white/10 animate-pulse" />
            <div className="flex items-center justify-between mt-auto pt-2">
              <div className="h-5 w-20 rounded bg-luxe-accent/20 animate-pulse" />
              <div className="h-7 w-7 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
