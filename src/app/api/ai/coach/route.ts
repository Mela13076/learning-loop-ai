import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { parseKeyConcepts } from "@/lib/topic-content"
import { AI_MODEL, isMockMode } from "@/lib/ai/config"
import {
  createHintResponse,
  createLearningCoachResponse,
  evaluateQuizAnswer,
} from "@/lib/ai/coach"
import type {
  LearningCoachContext,
  StoredCoachQuiz,
} from "@/lib/ai/coach-types"

const bodySchema = z
  .object({
    action: z.enum(["start", "explain", "example", "quiz", "hint", "answer"]),
    topicId: z.string().min(1),
    conceptTitle: z.string().min(1),
    conceptDescription: z.string().optional(),
    interactionId: z.string().optional(),
    quizIndex: z.number().int().min(0).optional(),
    selectedAnswer: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.action === "hint" || value.action === "answer") && !value.interactionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["interactionId"],
        message: "interactionId is required for hint and answer actions",
      })
    }

    if (value.action === "answer" && !value.selectedAnswer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selectedAnswer"],
        message: "selectedAnswer is required for answer actions",
      })
    }
  })

function getModelLabel(): string {
  return isMockMode ? "mock" : AI_MODEL
}

function parseStoredQuiz(response: string): StoredCoachQuiz | null {
  try {
    const parsed = JSON.parse(response) as StoredCoachQuiz
    if (
      parsed &&
      typeof parsed.question === "string" &&
      Array.isArray(parsed.options) &&
      typeof parsed.correctAnswer === "string"
    ) {
      return parsed
    }
  } catch {}

  return null
}

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

  const payload = parsed.data

  const [dbUser, topic] = await Promise.all([
    db.user.findUnique({ where: { clerkId } }),
    db.topic.findUnique({
      where: { id: payload.topicId },
      select: {
        id: true,
        title: true,
        keyConcepts: true,
        learningPath: { select: { title: true } },
      },
    }),
  ])

  if (!dbUser) {
    return Response.json({ error: "User not found" }, { status: 404 })
  }

  if (!topic) {
    return Response.json({ error: "Topic not found" }, { status: 404 })
  }

  const concepts = parseKeyConcepts(topic.keyConcepts)
  const matchedConcept =
    concepts.find((concept) => concept.title === payload.conceptTitle) ??
    concepts.find(
      (concept) => concept.title.toLowerCase() === payload.conceptTitle.toLowerCase()
    )

  if (!matchedConcept) {
    return Response.json({ error: "Concept not found on this topic" }, { status: 404 })
  }

  const context: LearningCoachContext = {
    topicTitle: topic.title,
    learningPathTitle: topic.learningPath.title,
    conceptTitle: matchedConcept.title,
    conceptDescription: payload.conceptDescription ?? matchedConcept.description,
  }

  if (payload.action === "hint" || payload.action === "answer") {
    const interaction = await db.aiInteraction.findFirst({
      where: {
        id: payload.interactionId,
        userId: dbUser.id,
        topicId: topic.id,
        interactionType: "TUTOR_QUESTION",
      },
      select: { id: true, response: true },
    })

    if (!interaction) {
      return Response.json({ error: "Quiz state not found" }, { status: 404 })
    }

    const storedQuiz = parseStoredQuiz(interaction.response)
    if (!storedQuiz) {
      return Response.json({ error: "Stored quiz state is invalid" }, { status: 500 })
    }

    const response =
      payload.action === "hint"
        ? createHintResponse(storedQuiz)
        : evaluateQuizAnswer({
            quiz: storedQuiz,
            selectedAnswer: payload.selectedAnswer ?? "",
          })

    await db.aiInteraction.create({
      data: {
        userId: dbUser.id,
        topicId: topic.id,
        interactionType: "TUTOR_QUESTION",
        prompt:
          payload.action === "hint"
            ? JSON.stringify({
                action: "hint",
                conceptTitle: context.conceptTitle,
                interactionId: interaction.id,
              })
            : JSON.stringify({
                action: "answer",
                conceptTitle: context.conceptTitle,
                interactionId: interaction.id,
                selectedAnswer: payload.selectedAnswer,
              }),
        response: response.content,
        modelUsed: getModelLabel(),
      },
    })

    return Response.json(response)
  }

  const coachResult = await createLearningCoachResponse({
    context,
    action: payload.action,
    quizIndex: payload.quizIndex,
  })

  if (coachResult.response.type === "quiz" && coachResult.storedQuiz) {
    const interaction = await db.aiInteraction.create({
      data: {
        userId: dbUser.id,
        topicId: topic.id,
        interactionType: "TUTOR_QUESTION",
        prompt: JSON.stringify({
          action: "quiz",
          conceptTitle: context.conceptTitle,
          quizIndex: payload.quizIndex ?? 0,
        }),
        response: JSON.stringify(coachResult.storedQuiz),
        modelUsed: getModelLabel(),
      },
      select: { id: true },
    })

    return Response.json({
      ...coachResult.response,
      interactionId: interaction.id,
    })
  }

  await db.aiInteraction.create({
    data: {
      userId: dbUser.id,
      topicId: topic.id,
      interactionType: "TUTOR_QUESTION",
      prompt: JSON.stringify({
        action: payload.action,
        conceptTitle: context.conceptTitle,
      }),
      response:
        coachResult.response.type === "lesson"
          ? coachResult.response.content
          : coachResult.response.question,
      modelUsed: getModelLabel(),
    },
  })

  return Response.json(coachResult.response)
}
