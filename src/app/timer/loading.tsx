export default function TimerLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8 text-center space-y-2">
          <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mx-auto" />
          <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mx-auto" />
        </div>

        <div className="max-w-xl mx-auto space-y-6">
          {/* Mode cards */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
              />
            ))}
          </div>
          {/* Topic selector */}
          <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          {/* Start button */}
          <div className="h-14 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </main>
    </div>
  );
}
