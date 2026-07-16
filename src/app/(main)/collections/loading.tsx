export default function CollectionsLoading() {
  return (
    <div className="animate-pulse page-container pt-6">
      <div className="h-10 bg-gray-200 rounded w-48 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-[4/3] bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
