import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseKeyConcepts } from "@/lib/topic-content";
import {
  computeTopicMastery,
  sanitizeCoveredConceptTitles,
} from "@/lib/topic-progress";

const bodySchema = z.object({
  title: z.string().min(1),
  completed: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { id: topicId } = await params;
  const [dbUser, topic] = await Promise.all([
    db.user.findUnique({ where: { clerkId } }),
    db.topic.findUnique({
      where: { id: topicId },
      select: { id: true, estimatedMinutes: true, keyConcepts: true },
    }),
  ]);

  if (!dbUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (!topic) {
    return Response.json({ error: "Topic not found" }, { status: 404 });
  }

  const existingProgress = await db.userTopicProgress.findUnique({
    where: {
      userId_topicId: {
        userId: dbUser.id,
        topicId,
      },
    },
  });

  const topicConceptTitles = parseKeyConcepts(topic.keyConcepts).map(
    (concept) => concept.title
  );

  if (!topicConceptTitles.includes(parsed.data.title)) {
    return Response.json({ error: "Concept not found" }, { status: 404 });
  }

  const currentCoveredConceptTitles = sanitizeCoveredConceptTitles({
    coveredConceptTitles: existingProgress?.coveredConceptTitles ?? [],
    validConceptTitles: topicConceptTitles,
  });
  const coveredConceptSet = new Set(currentCoveredConceptTitles);

  if (parsed.data.completed) {
    coveredConceptSet.add(parsed.data.title);
  } else {
    coveredConceptSet.delete(parsed.data.title);
  }

  const coveredConceptTitles = Array.from(coveredConceptSet);
  const mastery = computeTopicMastery({
    averageQuizScore: existingProgress?.averageQuizScore ?? 0,
    coveredConceptCount: coveredConceptTitles.length,
    finalQuizPassed: existingProgress?.finalQuizPassed ?? false,
    quizzesCompleted: existingProgress?.quizzesCompleted ?? 0,
    topicEstimatedMinutes: topic.estimatedMinutes,
    totalConceptCount: topicConceptTitles.length,
    totalStudyMinutes: existingProgress?.totalStudyMinutes ?? 0,
  });

  const progress = await db.userTopicProgress.upsert({
    where: {
      userId_topicId: {
        userId: dbUser.id,
        topicId,
      },
    },
    create: {
      userId: dbUser.id,
      topicId,
      averageQuizScore: existingProgress?.averageQuizScore ?? 0,
      coveredConceptTitles,
      finalQuizPassed: existingProgress?.finalQuizPassed ?? false,
      finalQuizPassedAt: existingProgress?.finalQuizPassedAt ?? null,
      lastStudiedAt: new Date(),
      masteryScore: mastery.masteryScore,
      quizzesCompleted: existingProgress?.quizzesCompleted ?? 0,
      status: mastery.status,
      totalStudyMinutes: existingProgress?.totalStudyMinutes ?? 0,
    },
    update: {
      coveredConceptTitles,
      lastStudiedAt: new Date(),
      masteryScore: mastery.masteryScore,
      status: mastery.status,
    },
  });

  return Response.json({
    progress: {
      coveredConceptTitles: progress.coveredConceptTitles,
      finalQuizPassed: progress.finalQuizPassed,
      masteryScore: progress.masteryScore,
      status: progress.status,
    },
  });
}
