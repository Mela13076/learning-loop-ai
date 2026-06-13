import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/topics/ProgressBar";
import { AiTutorChat } from "@/components/ai/AiTutorChat";
import { QuizGeneratorButton } from "@/components/quiz/QuizGeneratorButton";
import type { ProgressStatus, Difficulty } from "@/generated/prisma/enums";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIFFICULTY_BADGE: Record<
  Difficulty,
  { label: string; className: string }
> = {
  BEGINNER: {
    label: "Beginner",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  },
  ADVANCED: {
    label: "Advanced",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  },
};

const STATUS_CONFIG: Record<
  ProgressStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  NOT_STARTED: {
    label: "Not started",
    dotClass: "bg-muted-foreground/40",
    textClass: "text-muted-foreground",
  },
  IN_PROGRESS: {
    label: "In progress",
    dotClass: "bg-teal-500",
    textClass: "text-teal-600 dark:text-teal-400",
  },
  NEEDS_REVIEW: {
    label: "Needs review",
    dotClass: "bg-yellow-500",
    textClass: "text-yellow-600 dark:text-yellow-400",
  },
  MASTERED: {
    label: "Mastered",
    dotClass: "bg-green-500",
    textClass: "text-green-600 dark:text-green-400",
  },
};

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/login");

  const { id } = await params;

  const [topic, dbUser] = await Promise.all([
    db.topic.findUnique({
      where: { id },
      include: {
        learningPath: { select: { id: true, title: true, level: true } },
      },
    }),
    db.user.findUnique({ where: { clerkId: clerkUser.id } }),
  ]);

  if (!topic) notFound();

  // Fetch user progress (null = never started)
  const progress = dbUser
    ? await db.userTopicProgress.findUnique({
        where: {
          userId_topicId: { userId: dbUser.id, topicId: id },
        },
      })
    : null;

  // Adjacent topics for prev/next navigation
  const [prevTopic, nextTopic] = await Promise.all([
    db.topic.findFirst({
      where: {
        learningPathId: topic.learningPathId,
        orderIndex: { lt: topic.orderIndex },
      },
      orderBy: { orderIndex: "desc" },
      select: { id: true, title: true },
    }),
    db.topic.findFirst({
      where: {
        learningPathId: topic.learningPathId,
        orderIndex: { gt: topic.orderIndex },
      },
      orderBy: { orderIndex: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  const status: ProgressStatus = progress?.status ?? "NOT_STARTED";
  const statusCfg = STATUS_CONFIG[status];
  const diffBadge = DIFFICULTY_BADGE[topic.difficulty];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid size-7 place-items-center rounded-md bg-teal-600 text-sm text-white">
              LL
            </span>
            <span className="text-lg">Learning Loop AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/paths"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Learning Paths
            </Link>
            <UserButton />
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/paths"
            className="hover:text-foreground transition-colors"
          >
            Learning Paths
          </Link>
          <span>/</span>
          <Link
            href={`/paths/${topic.learningPath.id}`}
            className="hover:text-foreground transition-colors"
          >
            {topic.learningPath.title}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{topic.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content — left two columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${diffBadge.className}`}
                >
                  {diffBadge.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  ~{topic.estimatedMinutes} min
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                {topic.title}
              </h1>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Overview
              </h2>
              <p className="text-base leading-relaxed">{topic.description}</p>
            </div>

            {/* AI Tutor Chat */}
            <div id="ai-tutor" className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                AI Tutor
              </h2>
              <AiTutorChat topicId={topic.id} topicTitle={topic.title} />
            </div>

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-between gap-4 pt-2">
              {prevTopic ? (
                <Link
                  href={`/topics/${prevTopic.id}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← {prevTopic.title}
                </Link>
              ) : (
                <span />
              )}
              {nextTopic && (
                <Link
                  href={`/topics/${nextTopic.id}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {nextTopic.title} →
                </Link>
              )}
            </div>
          </div>

          {/* Sidebar — right column */}
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="font-semibold text-sm">Start studying</h2>

              <Button
                asChild
                className="w-full bg-teal-600 text-white hover:bg-teal-700"
              >
                <Link href={`/timer?topic=${topic.id}`}>
                  Start Study Timer
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <a href="#ai-tutor">Ask AI Tutor</a>
              </Button>

              <QuizGeneratorButton topicId={topic.id} />
            </div>

            {/* Progress card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="font-semibold text-sm">Your Progress</h2>

              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${statusCfg.dotClass}`} />
                <span className={`text-sm font-medium ${statusCfg.textClass}`}>
                  {statusCfg.label}
                </span>
              </div>

              {progress && (
                <>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Mastery</span>
                      <span>{Math.round(progress.masteryScore)}%</span>
                    </div>
                    <ProgressBar value={progress.masteryScore} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-lg font-bold">
                        {formatMinutes(progress.totalStudyMinutes)}
                      </p>
                      <p className="text-xs text-muted-foreground">studied</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-lg font-bold">
                        {progress.quizzesCompleted}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {progress.quizzesCompleted === 1 ? "quiz" : "quizzes"}
                      </p>
                    </div>
                  </div>

                  {progress.quizzesCompleted > 0 && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Avg quiz score:{" "}
                        <span className="font-medium text-foreground">
                          {Math.round(progress.averageQuizScore)}%
                        </span>
                      </p>
                    </div>
                  )}
                </>
              )}

              {!progress && (
                <p className="text-sm text-muted-foreground">
                  Start a study session or take a quiz to track your progress
                  here.
                </p>
              )}
            </div>

            {/* Path context */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-3 font-semibold text-sm">Learning Path</h2>
              <Link
                href={`/paths/${topic.learningPath.id}`}
                className="text-sm font-medium hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {topic.learningPath.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                Topic {topic.orderIndex}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
