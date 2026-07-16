export default function CartLoading() {
  return (
    <div className=" page-container pt-6">
      <div className="h-10 skeleton-shimmer bg-white/5 rounded w-32 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border border-gray-200 rounded-xl">
              <div className="w-24 h-24 skeleton-shimmer bg-white/5 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 skeleton-shimmer bg-white/5 rounded w-3/4" />
                <div className="h-4 skeleton-shimmer bg-white/5 rounded w-1/3" />
                <div className="h-4 skeleton-shimmer bg-white/5 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 border border-gray-200 rounded-xl h-64 space-y-4">
          <div className="h-6 skeleton-shimmer bg-white/5 rounded w-1/2" />
          <div className="h-4 skeleton-shimmer bg-white/5 rounded w-full" />
          <div className="h-4 skeleton-shimmer bg-white/5 rounded w-full" />
          <div className="h-12 skeleton-shimmer bg-white/5 rounded-xl w-full mt-4" />
        </div>
      </div>
    </div>
  );
}
