import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { TopicCard } from "@/components/topics/TopicCard";
import type { ProgressStatus, Difficulty } from "@/generated/prisma/enums";

const LEVEL_LABEL: Record<Difficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export default async function PathDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/login");

  const { id } = await params;

  const [path, dbUser] = await Promise.all([
    db.learningPath.findUnique({
      where: { id },
      include: { topics: { orderBy: { orderIndex: "asc" } } },
    }),
    db.user.findUnique({ where: { clerkId: clerkUser.id } }),
  ]);

  if (!path) notFound();

  // Load user progress for topics in this path (if user exists)
  const progressMap = new Map<
    string,
    { status: ProgressStatus; masteryScore: number }
  >();
  if (dbUser) {
    const topicIds = path.topics.map((t) => t.id);
    const progress = await db.userTopicProgress.findMany({
      where: { userId: dbUser.id, topicId: { in: topicIds } },
      select: { topicId: true, status: true, masteryScore: true },
    });
    for (const p of progress) {
      progressMap.set(p.topicId, {
        status: p.status as ProgressStatus,
        masteryScore: p.masteryScore,
      });
    }
  }

  const masteredCount = path.topics.filter(
    (t) => progressMap.get(t.id)?.status === "MASTERED"
  ).length;
  const inProgressCount = path.topics.filter(
    (t) => progressMap.get(t.id)?.status === "IN_PROGRESS"
  ).length;

  // Recommended next topic: first IN_PROGRESS, then first NOT_STARTED
  const nextTopic =
    path.topics.find(
      (t) => progressMap.get(t.id)?.status === "IN_PROGRESS"
    ) ??
    path.topics.find((t) => !progressMap.has(t.id) || progressMap.get(t.id)?.status === "NOT_STARTED");

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
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/paths"
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Learning Paths
            </Link>
            <Link
              href="/settings"
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Settings
            </Link>
            <UserButton />
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Link
          href="/paths"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Learning Paths
        </Link>

        {/* Path header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{path.title}</h1>
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-primary">
                {LEVEL_LABEL[path.level]}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              {path.description}
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{path.topics.length} topics</span>
              {masteredCount > 0 && (
                <>
                  <span>·</span>
                  <span className="text-green-600 dark:text-green-400">
                    {masteredCount} mastered
                  </span>
                </>
              )}
              {inProgressCount > 0 && (
                <>
                  <span>·</span>
                  <span className="text-primary">
                    {inProgressCount} in progress
                  </span>
                </>
              )}
            </div>
          </div>

          {nextTopic && (
            <Button asChild className="shrink-0">
              <Link href={`/topics/${nextTopic.id}`}>
                {inProgressCount > 0 ? "Continue studying" : "Start first topic"}
              </Link>
            </Button>
          )}
        </div>

        {/* Topics list */}
        <div className="space-y-3">
          {path.topics.map((topic) => {
            const p = progressMap.get(topic.id);
            return (
              <TopicCard
                key={topic.id}
                id={topic.id}
                title={topic.title}
                description={topic.description}
                difficulty={topic.difficulty}
                estimatedMinutes={topic.estimatedMinutes}
                orderIndex={topic.orderIndex}
                status={p?.status ?? "NOT_STARTED"}
                masteryScore={p?.masteryScore ?? 0}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
