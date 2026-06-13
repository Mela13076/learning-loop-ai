import Link from "next/link";

const learningLoop = [
  {
    title: "1. Choose a path",
    description:
      "Start with a structured learning path so you always know what topic to study next.",
  },
  {
    title: "2. Study with focus",
    description:
      "Use the timer to create real study sessions instead of vague intentions to learn later.",
  },
  {
    title: "3. Ask for guidance",
    description:
      "Use the AI Learning Coach to work through one concept at a time with explanations, examples, and short quizzes.",
  },
  {
    title: "4. Practice recall",
    description:
      "Generate quizzes on a topic so you can test what you actually remember.",
  },
  {
    title: "5. Track progress",
    description:
      "Review study time, quiz scores, and weak areas so you can improve over time.",
  },
];

const audience = [
  "College students learning computer science fundamentals",
  "Self-taught developers building a stronger study routine",
  "Bootcamp learners who need more structure and review",
  "People preparing for internships or junior software engineering roles",
];

const principles = [
  "Study actively instead of passively consuming tutorials",
  "Build consistency with repeatable study sessions",
  "Use AI as a guide, not a shortcut",
  "Measure progress so improvement is visible",
];

const mvpFeatures = [
  "Learning paths for structured CS and software engineering study",
  "Study timer sessions with notes and session tracking",
  "AI Learning Coach sessions tied to key concepts",
  "Topic-based quiz generation and results breakdowns",
  "Dashboard progress tracking for time, scores, streaks, and weak areas",
];

export default function AboutPage() {
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
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <section className="max-w-4xl">
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-medium text-primary">
            About Learning Loop AI
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            A place for learners to study, stay consistent, and track their CS growth
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Learning Loop AI is built for learners like you who want one focused place
            to study computer science and software engineering, keep track of that work,
            and improve through practice instead of guesswork.
          </p>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            The mission is simple: help learners build real study habits, understand
            technical topics more deeply, and see clear progress over time.
          </p>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-primary/50 bg-card p-8">
            <h2 className="text-2xl font-bold tracking-tight">Why this exists</h2>
            <div className="mt-5 space-y-4 text-muted-foreground">
              <p>
                A lot of learners bounce between videos, notes, AI chats, and random
                practice without a clear system. That makes it hard to stay consistent
                and even harder to know whether you are actually improving.
              </p>
              <p>
                Learning Loop AI is meant to solve that by combining study structure,
                active recall, guided help, and progress tracking in one workflow.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/50 bg-card p-8">
            <h2 className="text-2xl font-bold tracking-tight">
              What makes it different
            </h2>
            <div className="mt-5 space-y-4 text-muted-foreground">
              <p>
                This is not meant to be just another AI chat box. The coach is designed
                to guide you through key concepts with short explanations, examples,
                and quizzes before moving on.
              </p>
              <p>
                The goal is to help you think, recall, and practice, not just copy.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight">How the learning loop works</h2>
            <p className="mt-3 text-muted-foreground">
              The app is built around a repeatable cycle that helps you study with more
              intention and less friction.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {learningLoop.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-primary/50 bg-card p-6"
              >
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-primary/50 bg-card p-8">
            <h2 className="text-2xl font-bold tracking-tight">Who it is for</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
              {audience.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-primary/50 bg-card p-8">
            <h2 className="text-2xl font-bold tracking-tight">Core principles</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
              {principles.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-primary/50 bg-card p-8">
          <h2 className="text-2xl font-bold tracking-tight">What is in the app right now</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            The current MVP focuses on the core study workflow first: structure,
            practice, guided help, and progress tracking.
          </p>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {mvpFeatures.map((feature) => (
              <li
                key={feature}
                className="rounded-xl border border-primary/50 bg-background/40 px-4 py-4 text-sm leading-6 text-muted-foreground"
              >
                <span className="font-medium text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-2xl border border-primary/20 bg-[var(--accent-soft)]/50 p-8">
          <h2 className="text-2xl font-bold tracking-tight">The bigger goal</h2>
          <p className="mt-4 max-w-4xl text-base leading-7 text-muted-foreground">
            The bigger goal is to give learners a calm, practical place to come back to
            every day — a place where studying computer science feels more structured,
            more measurable, and more sustainable.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
              Back to home
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-lg border border-primary/50 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Go to dashboard
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
