export default function PathDetailLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b border-primary/50" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
        <div className="mb-6 h-4 w-28 rounded bg-muted" />
        <div className="mb-8">
          <div className="mb-2 h-7 w-64 rounded-lg bg-muted" />
          <div className="mb-1 h-4 w-full max-w-xl rounded bg-muted" />
          <div className="h-4 w-2/3 max-w-sm rounded bg-muted" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-primary/50 bg-card p-5"
            >
              <div className="flex items-start gap-3">
                <div className="size-6 shrink-0 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="mb-2 h-4 w-1/2 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
