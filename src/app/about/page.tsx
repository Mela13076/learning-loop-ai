import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-sm text-primary-foreground">
              LL
            </span>
            <span className="text-lg">Learning Loop AI</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back home
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-8">
          <h1 className="text-3xl font-bold tracking-tight">About Learning Loop AI</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Learning Loop AI is a study app focused on active recall, guided tutoring,
            structured learning paths, and consistent study habits.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            The goal is to help learners practice, reflect, and improve over time
            instead of relying on passive reading or instant answers.
          </p>
        </div>
      </main>
    </div>
  );
}
