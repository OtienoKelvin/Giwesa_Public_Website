export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading admin page">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="admin-card h-24 animate-pulse" />
        ))}
      </div>
      <div className="admin-card mt-6 h-72 animate-pulse" />
    </div>
  );
}
