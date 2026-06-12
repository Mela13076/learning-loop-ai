import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StudyTimer } from "@/components/timer/StudyTimer";

export default async function TimerPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/login");

  // Ensure user row exists
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  await db.user.upsert({
    where: { clerkId: clerkUser.id },
    create: { clerkId: clerkUser.id, email, name },
    update: { email, name },
  });

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              ← Dashboard
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="font-semibold text-sm">Study Timer</span>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Study Timer</h1>
          <p className="mt-1 text-gray-500 text-sm">
            Pick a mode, select a topic, and start your session.
          </p>
        </div>

        <StudyTimer topics={topics} />
      </main>
    </div>
  );
}
