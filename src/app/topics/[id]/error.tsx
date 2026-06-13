"use client"

import Link from "next/link"

export default function TopicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-primary/50 bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-sm text-primary-foreground">
              LL
            </span>
            <span className="text-lg">Learning Loop AI</span>
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-4 dark:bg-red-900/30">
            <svg className="size-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred loading this topic."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Try again
            </button>
            <Link
              href="/paths"
              className="rounded-lg border border-primary/50 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Learning paths
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
