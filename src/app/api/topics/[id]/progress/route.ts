import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";

const patchSchema = z.object({
  status: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "NEEDS_REVIEW", "MASTERED"])
    .optional(),
  masteryScore: z.number().min(0).max(100).optional(),
  totalStudyMinutes: z.number().int().min(0).optional(),
  quizzesCompleted: z.number().int().min(0).optional(),
  averageQuizScore: z.number().min(0).max(100).optional(),
  lastStudiedAt: z.string().datetime().optional(),
});

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
        lastStudiedAt: null,
      },
    });
  }

  return Response.json({ progress });
}

export async function PATCH(
  request: Request,
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

  const topic = await db.topic.findUnique({ where: { id: topicId } });
  if (!topic) {
    return Response.json({ error: "Topic not found" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const update = {
    ...(data.status !== undefined && { status: data.status }),
    ...(data.masteryScore !== undefined && { masteryScore: data.masteryScore }),
    ...(data.totalStudyMinutes !== undefined && {
      totalStudyMinutes: data.totalStudyMinutes,
    }),
    ...(data.quizzesCompleted !== undefined && {
      quizzesCompleted: data.quizzesCompleted,
    }),
    ...(data.averageQuizScore !== undefined && {
      averageQuizScore: data.averageQuizScore,
    }),
    ...(data.lastStudiedAt !== undefined && {
      lastStudiedAt: new Date(data.lastStudiedAt),
    }),
  };

  const progress = await db.userTopicProgress.upsert({
    where: { userId_topicId: { userId: dbUser.id, topicId } },
    create: {
      userId: dbUser.id,
      topicId,
      ...update,
    },
    update,
  });

  return Response.json({ progress });
}
