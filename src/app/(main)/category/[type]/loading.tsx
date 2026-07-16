export default function CategoryLoading() {
  return (
    <div className=" page-container pt-6">
      <div className="h-10 skeleton-shimmer bg-white/5 rounded w-48 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
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
