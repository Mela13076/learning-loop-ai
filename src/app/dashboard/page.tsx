import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { DashboardCard, StatValue } from "@/components/dashboard/DashboardCard";
import { StreakCard } from "@/components/dashboard/StreakCard";
import type { ProgressStatus, Difficulty } from "@/generated/prisma/enums";

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function computeStreak(endedAtDates: (Date | null)[]): number {
  const days = new Set(
    endedAtDates
      .filter((d): d is Date => d !== null)
      .map((d) => {
        const local = new Date(d);
        return `${local.getFullYear()}-${local.getMonth()}-${local.getDate()}`;
      })
  );

  const today = new Date();
  let streak = 0;

  for (let i = 0; i <= 365; i++) {
    const check = new Date(today);
    check.setDate(check.getDate() - i);
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;

    if (days.has(key)) {
      streak++;
    } else if (i > 0) {
      // Allow today to be empty (don't break mid-day)
      break;
    }
  }

  return streak;
}

function difficultyLabel(d: Difficulty): string {
  if (d === "BEGINNER") return "Beginner";
  if (d === "INTERMEDIATE") return "Intermediate";
  return "Advanced";
}

function statusLabel(s: ProgressStatus): string {
  if (s === "NOT_STARTED") return "Not started";
  if (s === "IN_PROGRESS") return "In progress";
  if (s === "NEEDS_REVIEW") return "Needs review";
  return "Mastered";
}

function statusColor(s: ProgressStatus): string {
  if (s === "NOT_STARTED") return "text-muted-foreground";
  if (s === "IN_PROGRESS") return "text-teal-600 dark:text-teal-400";
  if (s === "NEEDS_REVIEW") return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/login");

  // Sync the Clerk user into our database on every dashboard load.
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  const dbUser = await db.user.upsert({
    where: { clerkId: clerkUser.id },
    create: { clerkId: clerkUser.id, email, name },
    update: { email, name },
  });

  // Date boundaries
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekDay = now.getDay(); // 0=Sun
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekDay);

  // Parallel queries
  const [
    todayAgg,
    weekAgg,
    allSessionDates,
    lastSession,
    recentAttempts,
    topicProgress,
    learningPaths,
  ] = await Promise.all([
    db.studySession.aggregate({
      where: { userId: dbUser.id, endedAt: { gte: todayStart } },
      _sum: { durationMinutes: true },
    }),
    db.studySession.aggregate({
      where: { userId: dbUser.id, endedAt: { gte: weekStart } },
      _sum: { durationMinutes: true },
    }),
    db.studySession.findMany({
      where: { userId: dbUser.id, endedAt: { not: null } },
      select: { endedAt: true },
    }),
    db.studySession.findFirst({
      where: { userId: dbUser.id, endedAt: { not: null } },
      orderBy: { endedAt: "desc" },
      select: { endedAt: true, topic: { select: { id: true, title: true } } },
    }),
    db.quizAttempt.findMany({
      where: { userId: dbUser.id, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: {
        quiz: { include: { topic: { select: { id: true, title: true } } } },
        answers: {include: { question: true },},
      },
    }),
    db.userTopicProgress.findMany({
      where: { userId: dbUser.id },
      include: {
        topic: {
          include: { learningPath: { select: { id: true, title: true } } },
        },
      },
      orderBy: { lastStudiedAt: "desc" },
    }),
    db.learningPath.findMany({
      include: { topics: { orderBy: { orderIndex: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Derived stats
  const todayMinutes = todayAgg._sum.durationMinutes ?? 0;
  const weekMinutes = weekAgg._sum.durationMinutes ?? 0;
  const streak = computeStreak(allSessionDates.map((s) => s.endedAt));
  const lastStudiedAt = lastSession?.endedAt ?? null;

  const progressByTopicId = new Map(topicProgress.map((p) => [p.topicId, p]));

  const topicsInProgress = topicProgress.filter(
    (p) => p.status === "IN_PROGRESS"
  ).length;

  const weakTopics = topicProgress
    .filter(
      (p) =>
        p.quizzesCompleted > 0 &&
        (p.averageQuizScore < 50 || p.status === "NEEDS_REVIEW")
    )
    .slice(0, 4);

  // Current path = the path of the most recently studied topic
  const currentPathId = topicProgress[0]?.topic.learningPath.id ?? null;
  const currentPath = currentPathId
    ? learningPaths.find((lp) => lp.id === currentPathId) ?? null
    : null;

  // Recommended next topic: first IN_PROGRESS, then first NOT_STARTED in order
  let recommendedTopic: {
    id: string;
    title: string;
    pathTitle: string;
    estimatedMinutes: number;
  } | null = null;

  for (const lp of learningPaths) {
    for (const topic of lp.topics) {
      const p = progressByTopicId.get(topic.id);
      if (!p || p.status === "IN_PROGRESS") {
        recommendedTopic = {
          id: topic.id,
          title: topic.title,
          pathTitle: lp.title,
          estimatedMinutes: topic.estimatedMinutes,
        };
        break;
      }
    }
    if (recommendedTopic) break;
  }

  const greetingName = clerkUser.firstName ?? "there";

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
              href="/paths"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Learning Paths
            </Link>
            <Link
              href="/timer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Study Timer
            </Link>
            <UserButton />
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {greetingName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {topicsInProgress > 0
                ? `You have ${topicsInProgress} topic${topicsInProgress !== 1 ? "s" : ""} in progress.`
                : "Pick a learning path to start studying."}
            </p>
          </div>
          {lastSession?.topic ? (
            <Button
              asChild
              className="shrink-0 bg-teal-600 text-white hover:bg-teal-700"
            >
              <Link href={`/topics/${lastSession.topic.id}`}>
                Continue studying
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              className="shrink-0 bg-teal-600 text-white hover:bg-teal-700"
            >
              <Link href="/paths">Browse learning paths</Link>
            </Button>
          )}
        </div>

        {/* Stat row */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard title="Today">
            <StatValue
              value={todayMinutes === 0 ? "0m" : formatMinutes(todayMinutes)}
              label="study time"
            />
          </DashboardCard>

          <DashboardCard title="This Week">
            <StatValue
              value={weekMinutes === 0 ? "0m" : formatMinutes(weekMinutes)}
              label="study time"
            />
          </DashboardCard>

          <StreakCard streak={streak} lastStudiedAt={lastStudiedAt} />

          <DashboardCard title="Topics in Progress">
            <StatValue
              value={topicsInProgress}
              label={topicsInProgress === 1 ? "topic" : "topics"}
            />
          </DashboardCard>
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current learning path */}
          {currentPath ? (
            <DashboardCard
              title="Current Learning Path"
              action={{ label: "View path", href: `/paths/${currentPath.id}` }}
            >
              <p className="font-semibold">{currentPath.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {difficultyLabel(currentPath.level)} ·{" "}
                {currentPath.topics.length} topics
              </p>
              <div className="mt-4 space-y-2">
                {currentPath.topics.slice(0, 5).map((topic) => {
                  const p = progressByTopicId.get(topic.id);
                  const status: ProgressStatus = p?.status ?? "NOT_STARTED";
                  return (
                    <Link
                      key={topic.id}
                      href={`/topics/${topic.id}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <span className="text-sm">{topic.title}</span>
                      <span
                        className={`text-xs font-medium ${statusColor(status)}`}
                      >
                        {statusLabel(status)}
                      </span>
                    </Link>
                  );
                })}
                {currentPath.topics.length > 5 && (
                  <p className="px-3 text-xs text-muted-foreground">
                    +{currentPath.topics.length - 5} more topics
                  </p>
                )}
              </div>
            </DashboardCard>
          ) : (
            <DashboardCard title="Start a Learning Path">
              <p className="mb-4 text-sm text-muted-foreground">
                Choose a path to begin your learning journey.
              </p>
              <div className="space-y-3">
                {learningPaths.map((lp) => (
                  <Link
                    key={lp.id}
                    href={`/paths/${lp.id}`}
                    className="block rounded-xl border border-border bg-card p-4 hover:border-teal-600/50 transition-all duration-200"
                  >
                    <p className="font-medium">{lp.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {difficultyLabel(lp.level)} · {lp.topics.length} topics
                    </p>
                  </Link>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* Recent quiz scores */}
          <DashboardCard title="Recent Quiz Scores">
            {recentAttempts.length === 0 ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">
                  No quizzes completed yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Generate a quiz from any topic page to practice with active
                  recall.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAttempts.map((attempt) => {
                  const pct =
                    attempt.totalQuestions > 0
                      ? Math.round(attempt.score)  
                      : 0;
                  return (
                    <Link
                      key={attempt.id}
                      href={`/quiz-results/${attempt.id}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {attempt.quiz.topic?.title ?? "Unknown topic"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attempt.answers.filter((a) => a.isCorrect).length}/{attempt.totalQuestions} correct
                        </p>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          pct >= 80
                            ? "text-green-600 dark:text-green-400"
                            : pct >= 60
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {pct}%
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </DashboardCard>

          {/* Weak topics */}
          <DashboardCard title="Topics to Review">
            {weakTopics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {topicProgress.length === 0
                  ? "Start studying to track your weak areas."
                  : "No weak topics — keep it up!"}
              </p>
            ) : (
              <div className="space-y-2">
                {weakTopics.map((p) => (
                  <Link
                    key={p.id}
                    href={`/topics/${p.topicId}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.topic.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.topic.learningPath.title}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      {Math.round(p.averageQuizScore)}% avg
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Recommended next topic */}
          <DashboardCard title="Recommended Next Topic">
            {recommendedTopic ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-semibold">{recommendedTopic.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {recommendedTopic.pathTitle} ·{" "}
                    {recommendedTopic.estimatedMinutes} min
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    asChild
                    className="bg-teal-600 text-white hover:bg-teal-700"
                    size="sm"
                  >
                    <Link href={`/topics/${recommendedTopic.id}`}>
                      Start topic
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/timer?topic=${recommendedTopic.id}`}>
                      Study timer
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You&apos;ve mastered all available topics — great work!
              </p>
            )}
          </DashboardCard>
        </div>
      </main>
    </div>
  );
}
