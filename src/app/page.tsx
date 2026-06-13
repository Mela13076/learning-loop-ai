import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Guided AI Tutor",
    description:
      "Get hints, guiding questions, and examples before the answer — so you actually learn, not just copy.",
  },
  {
    title: "Active Recall Quizzes",
    description:
      "AI-generated quizzes per topic with instant feedback and explanations for every answer.",
  },
  {
    title: "Study Timer & Streaks",
    description:
      "Pomodoro and Deep Work modes that track focus time and build consistent daily habits.",
  },
  {
    title: "Progress Tracking",
    description:
      "Mastery scores across topics surface your weak areas and recommend what to study next.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-sm text-primary-foreground">
              LL
            </span>
            <span className="text-lg">Learning Loop AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </Show>
            <Show when="signed-in">
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserButton />
            </Show>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-medium text-primary">
            Study actively, not passively
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Build consistent study habits and{" "}
            <span className="text-primary">
              master software engineering
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Learning Loop AI combines study timers, structured learning paths, AI
            tutoring, and quizzes to help you learn through active recall — with an
            AI that guides you instead of handing over answers.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Show when="signed-out">
              <Button size="lg" asChild>
                <Link href="/signup">Start learning free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">I already have an account</Link>
              </Button>
            </Show>
            <Show when="signed-in">
              <Button size="lg" asChild>
                <Link href="/dashboard">Continue studying</Link>
              </Button>
            </Show>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/50"
              >
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <span>© 2026 Learning Loop AI</span>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
        </div>
      </footer>
    </div>
  );
}
