import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getRecommendation } from "@/lib/ai/recommendation"
import { AI_MODEL } from "@/lib/ai/config"

const bodySchema = z.object({
  topicId: z.string().min(1),
  recentQuizScores: z.array(z.number().min(0).max(100)).optional().default([]),
  weakTopics: z.array(z.string()).optional().default([]),
})

export async function POST(request: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return Response.json({ error: "User not found" }, { status: 404 })

  const topic = await db.topic.findUnique({
    where: { id: parsed.data.topicId },
    include: { learningPath: { select: { title: true } } },
  })
  if (!topic) return Response.json({ error: "Topic not found" }, { status: 404 })

  const progress = await db.userTopicProgress.findUnique({
    where: { userId_topicId: { userId: dbUser.id, topicId: topic.id } },
    select: { masteryScore: true, status: true },
  })

  const input = {
    currentTopicTitle: topic.title,
    isMastered: progress?.status === "MASTERED",
    learningPathTitle: topic.learningPath.title,
    masteryScore: Math.round(progress?.masteryScore ?? 0),
    recentQuizScores: parsed.data.recentQuizScores,
    weakTopics: parsed.data.weakTopics,
  }

  const recommendation = await getRecommendation(input)

  await db.aiInteraction.create({
    data: {
      userId: dbUser.id,
      topicId: topic.id,
      interactionType: "RECOMMENDATION",
      prompt: JSON.stringify(input),
      response: JSON.stringify(recommendation),
      modelUsed: AI_MODEL,
    },
  })

  return Response.json(recommendation)
}
