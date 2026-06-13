export default function QuizLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-primary/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="space-y-1">
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        {/* Question card skeleton */}
        <div className="rounded-xl border border-primary/50 bg-card p-6 sm:p-8 animate-pulse">
          <div className="mb-2 h-3 w-28 rounded bg-muted" />
          <div className="mb-6 space-y-2">
            <div className="h-5 w-full rounded bg-muted" />
            <div className="h-5 w-4/5 rounded bg-muted" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-primary/50 p-4">
                <div className="size-4 rounded-full bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <div className="h-9 w-24 rounded-lg bg-muted" />
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="size-2 rounded-full bg-muted" />
              ))}
            </div>
            <div className="h-9 w-24 rounded-lg bg-muted" />
          </div>
        </div>

        {/* Navigator skeleton */}
        <div className="mt-6 rounded-xl border border-primary/50 bg-card p-4 animate-pulse">
          <div className="mb-3 h-3 w-28 rounded bg-muted" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="size-8 rounded-md bg-muted" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
