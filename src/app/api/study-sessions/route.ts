import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseKeyConcepts } from "@/lib/topic-content";
import {
  computeTopicMastery,
  sanitizeCoveredConceptTitles,
} from "@/lib/topic-progress";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const CreateSessionSchema = z.object({
  sessionId: z.uuid(),
  durationMinutes: z.number().int().min(1),
  timerMode: z.enum(["POMODORO", "DEEP_WORK", "CUSTOM"]),
  topicId: z.string().optional(),
  notes: z.string().optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// POST /api/study-sessions — save a completed session
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const parsed = CreateSessionSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { sessionId, durationMinutes, timerMode, topicId, notes, startedAt, endedAt } =
    parsed.data;

  // Serializable transactions protect both duplicate saves and concurrent saves
  // of different sessions that update the same topic's totals.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await db.$transaction(async (tx) => {
        const existing = await tx.studySession.findUnique({
          where: { id: sessionId },
          include: { topic: { select: { id: true, title: true } } },
        });

        if (existing) {
          if (
            existing.userId !== dbUser.id ||
            existing.topicId !== (topicId ?? null) ||
            existing.durationMinutes !== durationMinutes ||
            existing.timerMode !== timerMode ||
            existing.notes !== (notes ?? null) ||
            existing.startedAt.getTime() !== new Date(startedAt).getTime() ||
            existing.endedAt?.getTime() !== new Date(endedAt).getTime()
          ) {
            return { error: "Session ID already used for a different save", status: 409 } as const;
          }
          return { session: existing, status: 200 } as const;
        }

        // If a topicId is provided, verify it exists (don't trust client)
        let topicConceptTitles: string[] = [];
        let topicEstimatedMinutes = 0;

        if (topicId) {
          const topic = await tx.topic.findUnique({
            where: { id: topicId },
            select: { id: true, estimatedMinutes: true, keyConcepts: true },
          });
          if (!topic) {
            return { error: "Topic not found", status: 404 } as const;
          }
          topicEstimatedMinutes = topic.estimatedMinutes;
          topicConceptTitles = parseKeyConcepts(topic.keyConcepts).map(
            (concept) => concept.title
          );
        }

        const session = await tx.studySession.create({
          data: {
            id: sessionId,
            userId: dbUser.id,
            topicId: topicId ?? null,
            durationMinutes,
            timerMode,
            notes: notes ?? null,
            startedAt: new Date(startedAt),
            endedAt: new Date(endedAt),
          },
          include: {
            topic: { select: { id: true, title: true } },
          },
        });

        // Update topic progress when a session has an associated topic
        if (topicId) {
          const sessionEndedAt = new Date(endedAt);
          const existingProgress = await tx.userTopicProgress.findUnique({
            where: { userId_topicId: { userId: dbUser.id, topicId } },
          });
          const coveredConceptTitles = sanitizeCoveredConceptTitles({
            coveredConceptTitles: existingProgress?.coveredConceptTitles ?? [],
            validConceptTitles: topicConceptTitles,
          });
          const mastery = computeTopicMastery({
            averageQuizScore: existingProgress?.averageQuizScore ?? 0,
            coveredConceptCount: coveredConceptTitles.length,
            finalQuizPassed: existingProgress?.finalQuizPassed ?? false,
            quizzesCompleted: existingProgress?.quizzesCompleted ?? 0,
            topicEstimatedMinutes,
            totalConceptCount: topicConceptTitles.length,
            totalStudyMinutes:
              (existingProgress?.totalStudyMinutes ?? 0) + durationMinutes,
          });

          await tx.userTopicProgress.upsert({
            where: { userId_topicId: { userId: dbUser.id, topicId } },
            create: {
              userId: dbUser.id,
              topicId,
              averageQuizScore: existingProgress?.averageQuizScore ?? 0,
              coveredConceptTitles,
              finalQuizPassed: existingProgress?.finalQuizPassed ?? false,
              finalQuizPassedAt: existingProgress?.finalQuizPassedAt ?? null,
              lastStudiedAt: sessionEndedAt,
              masteryScore: mastery.masteryScore,
              quizzesCompleted: existingProgress?.quizzesCompleted ?? 0,
              status: mastery.status,
              totalStudyMinutes:
                (existingProgress?.totalStudyMinutes ?? 0) + durationMinutes,
            },
            update: {
              coveredConceptTitles,
              finalQuizPassed: existingProgress?.finalQuizPassed ?? false,
              finalQuizPassedAt: existingProgress?.finalQuizPassedAt ?? null,
              lastStudiedAt: sessionEndedAt,
              masteryScore: mastery.masteryScore,
              status: mastery.status,
              totalStudyMinutes:
                (existingProgress?.totalStudyMinutes ?? 0) + durationMinutes,
            },
          });
        }

        return { session, status: 201 } as const;
      }, { isolationLevel: "Serializable" });

      if ("error" in result) {
        return Response.json({ error: result.error }, { status: result.status });
      }
      return Response.json({ session: result.session }, { status: result.status });
    } catch (error) {
      // A simultaneous request may insert this ID first (P2002), or another
      // transaction may update the same progress row (P2034). Retry from scratch.
      const code = error && typeof error === "object" && "code" in error
        ? error.code
        : undefined;
      if (code !== "P2002" && code !== "P2034") throw error;
    }
  }

  return Response.json(
    { error: "Session save is busy. Please retry." },
    { status: 503, headers: { "Retry-After": "1" } }
  );
}

// ---------------------------------------------------------------------------
// GET /api/study-sessions — list sessions for the current user
// ---------------------------------------------------------------------------

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const sessions = await db.studySession.findMany({
    where: { userId: dbUser.id },
    orderBy: { startedAt: "desc" },
    include: {
      topic: { select: { id: true, title: true } },
    },
  });

  return Response.json({ sessions });
}
