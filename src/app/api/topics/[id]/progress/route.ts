import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// Progress is derived by quiz, study-session, and concept handlers.
// This endpoint only reads progress; direct writes are not supported.
async function getDbUser(clerkId: string) {
  return db.user.findUnique({ where: { clerkId } });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getDbUser(userId);
  if (!dbUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const { id: topicId } = await params;

  const progress = await db.userTopicProgress.findUnique({
    where: { userId_topicId: { userId: dbUser.id, topicId } },
  });

  // Return a default shape when no progress row exists yet
  if (!progress) {
    return Response.json({
      progress: {
        topicId,
        status: "NOT_STARTED",
        masteryScore: 0,
        totalStudyMinutes: 0,
        quizzesCompleted: 0,
        averageQuizScore: 0,
        coveredConceptTitles: [],
        finalQuizPassed: false,
        finalQuizPassedAt: null,
        lastStudiedAt: null,
      },
    });
  }

  return Response.json({ progress });
}
