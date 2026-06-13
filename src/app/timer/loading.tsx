export default function TimerLoading() {
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

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center space-y-2">
          <div className="h-8 w-40 rounded bg-muted animate-pulse mx-auto" />
          <div className="h-4 w-64 rounded bg-muted animate-pulse mx-auto" />
        </div>

        <div className="max-w-xl mx-auto space-y-6">
          {/* Mode cards */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-primary/50 bg-card animate-pulse"
              />
            ))}
          </div>
          {/* Topic selector */}
          <div className="h-10 rounded-lg border border-primary/50 bg-card animate-pulse" />
          {/* Start button */}
          <div className="h-14 rounded-lg bg-muted animate-pulse" />
        </div>
      </main>
    </div>
  );
}
