import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getTutorResponse } from "@/lib/ai/tutor"
import { AI_MODEL } from "@/lib/ai/config"

const bodySchema = z.object({
  topicId: z.string().min(1),
  userQuestion: z.string().min(1),
  attemptCount: z.number().int().min(0),
  quizHistory: z.string().optional(),
})

export async function POST(request: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: unknown = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const { topicId, userQuestion, attemptCount, quizHistory } = parsed.data

  const [dbUser, topic] = await Promise.all([
    db.user.findUnique({ where: { clerkId } }),
    db.topic.findUnique({
      where: { id: topicId },
      select: { id: true, title: true, learningPath: { select: { title: true } } },
    }),
  ])

  if (!dbUser) {
    return Response.json({ error: "User not found" }, { status: 404 })
  }
  if (!topic) {
    return Response.json({ error: "Topic not found" }, { status: 404 })
  }

  const tutorResponse = await getTutorResponse({
    userQuestion,
    topicTitle: topic.title,
    learningPathTitle: topic.learningPath.title,
    attemptCount,
    quizHistory,
  })

  await db.aiInteraction.create({
    data: {
      userId: dbUser.id,
      topicId: topic.id,
      interactionType: "TUTOR_QUESTION",
      prompt: userQuestion,
      response: tutorResponse.content,
      modelUsed: AI_MODEL,
    },
  })

  return Response.json(tutorResponse)
}
