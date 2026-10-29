export default function PublicLoading() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <div className="container-page py-16">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-12 w-3/4 max-w-2xl animate-pulse rounded bg-muted" />
        <div className="mt-3 h-12 w-1/2 max-w-xl animate-pulse rounded bg-muted" />
        <div className="mt-8 h-5 w-full max-w-xl animate-pulse rounded bg-muted" />
        <div className="mt-3 h-5 w-5/6 max-w-lg animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
