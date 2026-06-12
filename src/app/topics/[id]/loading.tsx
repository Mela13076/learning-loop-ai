export default function TopicLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b border-border" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-4 w-2 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-4 w-2 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="mb-3 h-5 w-20 rounded-full bg-muted" />
              <div className="h-8 w-3/4 rounded-lg bg-muted" />
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-3 h-4 w-20 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-5/6 rounded bg-muted" />
                <div className="h-4 w-4/6 rounded bg-muted" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-10 w-full rounded-lg bg-muted" />
              <div className="h-10 w-full rounded-lg bg-muted" />
              <div className="h-10 w-full rounded-lg bg-muted" />
            </div>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-2.5 w-full rounded-full bg-muted" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
