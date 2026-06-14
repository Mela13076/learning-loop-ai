import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LearningPathCard } from "@/components/paths/LearningPathCard";

export default async function PathsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/login");

  const dbUser = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  const learningPaths = await db.learningPath.findMany({
    include: { topics: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });

  // If user exists, fetch their progress for all topics
  const progressMap = new Map<
    string,
    { status: string; masteryScore: number }
  >();
  if (dbUser) {
    const allProgress = await db.userTopicProgress.findMany({
      where: { userId: dbUser.id },
      select: { topicId: true, status: true, masteryScore: true },
    });
    for (const p of allProgress) {
      progressMap.set(p.topicId, { status: p.status, masteryScore: p.masteryScore });
    }
  }

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
              href="/timer"
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Study Timer
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Learning Paths</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a structured path to guide your learning journey.
          </p>
        </div>

        {learningPaths.length === 0 && (
          <div className="rounded-xl border border-primary/50 bg-card p-10 text-center">
            <p className="text-muted-foreground text-sm">
              No learning paths available yet. Check back soon!
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {learningPaths.map((path) => {
            const topicIds = path.topics.map((t) => t.id);
            const completedCount = topicIds.filter(
              (id) => progressMap.get(id)?.status === "MASTERED"
            ).length;
            const inProgressCount = topicIds.filter(
              (id) => progressMap.get(id)?.status === "IN_PROGRESS"
            ).length;

            return (
              <LearningPathCard
                key={path.id}
                id={path.id}
                title={path.title}
                description={path.description}
                level={path.level}
                topicCount={topicIds.length}
                completedCount={completedCount}
                inProgressCount={inProgressCount}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
