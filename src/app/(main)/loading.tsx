export default function HomeLoading() {
  return (
    <div className="">
      {/* Hero banner skeleton */}
      <div className="w-full h-[60vh] skeleton-shimmer bg-white/5 rounded-2xl mb-8" />
      {/* Section title */}
      <div className="h-8 skeleton-shimmer bg-white/5 rounded w-48 mx-auto mb-6" />
      {/* Product grid - 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 mb-12">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] skeleton-shimmer bg-white/5 rounded-xl" />
            <div className="h-4 skeleton-shimmer bg-white/5 rounded w-3/4" />
            <div className="h-4 skeleton-shimmer bg-white/5 rounded w-1/2" />
          </div>
        ))}
      </div>
      {/* Another section */}
      <div className="h-8 skeleton-shimmer bg-white/5 rounded w-48 mx-auto mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] skeleton-shimmer bg-white/5 rounded-xl" />
            <div className="h-4 skeleton-shimmer bg-white/5 rounded w-3/4" />
            <div className="h-4 skeleton-shimmer bg-white/5 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
