export default function QuizResultsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-primary/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-4 sm:px-6">
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 animate-pulse">
        {/* Score summary skeleton */}
        <div className="mb-6 rounded-xl border border-primary/50 bg-card p-6 text-center">
          <div className="mx-auto mb-4 size-24 rounded-full bg-muted" />
          <div className="mx-auto mb-2 h-6 w-32 rounded bg-muted" />
          <div className="mx-auto h-4 w-48 rounded bg-muted" />
        </div>

        {/* Areas to review skeleton */}
        <div className="mb-6 rounded-xl border border-primary/50 bg-card p-6">
          <div className="mb-4 h-4 w-36 rounded bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-muted" />
            ))}
          </div>
        </div>

        {/* Question breakdown skeleton */}
        <div className="rounded-xl border border-primary/50 bg-card p-6">
          <div className="mb-4 h-4 w-40 rounded bg-muted" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-primary/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="size-5 rounded-full bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                </div>
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Recommended next step skeleton */}
        <div className="mt-6 rounded-xl border border-primary/50 bg-card p-6">
          <div className="mb-4 h-4 w-40 rounded bg-muted" />
          <div className="flex flex-wrap gap-3">
            <div className="h-9 w-32 rounded-lg bg-muted" />
            <div className="h-9 w-32 rounded-lg bg-muted" />
            <div className="h-9 w-32 rounded-lg bg-muted" />
          </div>
        </div>
      </main>
    </div>
  )
}
