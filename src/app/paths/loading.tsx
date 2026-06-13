export default function PathsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b border-primary/50" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 animate-pulse">
          <div className="h-7 w-40 rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-64 rounded bg-muted" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-primary/50 bg-card p-6"
            >
              <div className="mb-3 h-5 w-3/4 rounded bg-muted" />
              <div className="mb-2 h-4 w-full rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="mt-4 h-3 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
