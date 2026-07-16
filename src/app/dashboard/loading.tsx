export default function DashboardLoading() {
  return (
    <div className=" space-y-6">
      <div className="h-8 skeleton-shimmer bg-foreground/ rounded w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 border border-gray-200 rounded-xl space-y-3">
            <div className="h-4 skeleton-shimmer bg-foreground/ rounded w-1/2" />
            <div className="h-8 skeleton-shimmer bg-foreground/ rounded w-3/4" />
          </div>
        ))}
      </div>
      <div className="h-64 skeleton-shimmer bg-foreground/ rounded-xl" />
    </div>
  );
}
