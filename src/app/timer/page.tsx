import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StudyTimer } from "@/components/timer/StudyTimer";
import { syncClerkUser } from "@/lib/user";

export default async function TimerPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/login");

  await syncClerkUser(clerkUser);

  const { topic: initialTopicId } = await searchParams;

  // Fetch all topics with their learning path title
  const topicRows = await db.topic.findMany({
    include: { learningPath: { select: { title: true } } },
    orderBy: [{ learningPath: { title: "asc" } }, { orderIndex: "asc" }],
  });

  const topics = topicRows.map((t) => ({
    id: t.id,
    title: t.title,
    pathTitle: t.learningPath.title,
    estimatedMinutes: t.estimatedMinutes,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
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
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
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

      {/* Main */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Study Timer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a mode, select a topic, and start your session.
          </p>
        </div>

        <StudyTimer topics={topics} initialTopicId={initialTopicId} />
      </main>
    </div>
  );
}
