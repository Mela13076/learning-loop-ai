import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { generateQuiz } from "@/lib/ai/quiz"
import { AI_MODEL } from "@/lib/ai/config"
import type { QuizDifficulty, QuizQuestionType, GeneratedQuestionType } from "@/lib/ai/quiz"

const bodySchema = z.object({
  topicId: z.string().min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  questionCount: z.union([z.literal(5), z.literal(10), z.literal(15)]),
  questionType: z.enum(["multiple_choice", "short_answer", "mixed"]),
})

const QUESTION_TYPE_MAP: Record<GeneratedQuestionType, "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "CODE_READING" | "DEBUGGING"> = {
  multiple_choice: "MULTIPLE_CHOICE",
  short_answer: "SHORT_ANSWER",
  code_reading: "CODE_READING",
  debugging: "DEBUGGING",
}

const DIFFICULTY_MAP: Record<QuizDifficulty, "BEGINNER" | "INTERMEDIATE" | "ADVANCED"> = {
  beginner: "BEGINNER",
  intermediate: "INTERMEDIATE",
  advanced: "ADVANCED",
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

  const { topicId, difficulty, questionCount, questionType } = parsed.data

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

  const generated = await generateQuiz({
    topicTitle: topic.title,
    learningPathTitle: topic.learningPath.title,
    difficulty: difficulty as QuizDifficulty,
    questionCount: questionCount as 5 | 10 | 15,
    questionType: questionType as QuizQuestionType,
  })

  const quiz = await db.quiz.create({
    data: {
      userId: dbUser.id,
      topicId: topic.id,
      title: `${topic.title} — ${difficulty} quiz`,
      difficulty: DIFFICULTY_MAP[difficulty as QuizDifficulty],
      questionCount: generated.questions.length,
      questions: {
        create: generated.questions.map((q) => ({
          questionText: q.questionText,
          questionType: QUESTION_TYPE_MAP[q.questionType],
          options: q.options ?? [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          orderIndex: q.orderIndex,
        })),
      },
    },
    select: { id: true },
  })

  await db.aiInteraction.create({
    data: {
      userId: dbUser.id,
      topicId: topic.id,
      interactionType: "QUIZ_GENERATION",
      prompt: `Generate ${questionCount} ${difficulty} ${questionType} questions about ${topic.title}`,
      response: JSON.stringify(generated),
      modelUsed: AI_MODEL,
    },
  })

  return Response.json({ quizId: quiz.id })
}
