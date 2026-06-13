export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-primary/50 bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-primary" />
            <div className="h-5 w-36 rounded bg-muted animate-pulse" />
          </div>
          <div className="size-8 rounded-full bg-muted animate-pulse" />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome skeleton */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-7 w-56 rounded bg-muted animate-pulse" />
            <div className="h-4 w-72 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
        </div>

        {/* Stat row skeleton */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-primary/50 bg-card p-5">
              <div className="mb-4 h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-8 w-16 rounded bg-muted animate-pulse" />
              <div className="mt-1 h-4 w-20 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content grid skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-primary/50 bg-card p-5">
              <div className="mb-4 h-4 w-36 rounded bg-muted animate-pulse" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-10 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
