"use client"

import Link from "next/link"

export default function QuizResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-primary/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/paths"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Learning Paths
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-4 dark:bg-red-900/30">
            <svg className="size-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred loading quiz results."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="rounded-lg border border-primary/50 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
