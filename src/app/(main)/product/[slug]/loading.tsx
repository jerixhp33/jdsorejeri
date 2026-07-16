export default function ProductLoading() {
  return (
    <div className=" page-container pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div className="aspect-square skeleton-shimmer bg-white/5 rounded-2xl" />
        {/* Product info */}
        <div className="space-y-4 py-4">
          <div className="h-8 skeleton-shimmer bg-white/5 rounded w-3/4" />
          <div className="h-6 skeleton-shimmer bg-white/5 rounded w-1/3" />
          <div className="h-4 skeleton-shimmer bg-white/5 rounded w-full" />
          <div className="h-4 skeleton-shimmer bg-white/5 rounded w-full" />
          <div className="h-4 skeleton-shimmer bg-white/5 rounded w-2/3" />
          <div className="h-12 skeleton-shimmer bg-white/5 rounded-xl w-full mt-8" />
          <div className="h-12 skeleton-shimmer bg-white/5 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}
