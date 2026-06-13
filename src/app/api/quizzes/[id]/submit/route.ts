import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getAnswerFeedback } from "@/lib/ai/feedback"
import { AI_MODEL } from "@/lib/ai/config"

const bodySchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      userAnswer: z.string(),
    })
  ),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: quizId } = await params

  const body: unknown = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const [dbUser, quiz] = await Promise.all([
    db.user.findUnique({ where: { clerkId } }),
    db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: { orderBy: { orderIndex: "asc" } },
        topic: { select: { id: true, title: true } },
      },
    }),
  ])

  if (!dbUser) {
    return Response.json({ error: "User not found" }, { status: 404 })
  }
  if (!quiz) {
    return Response.json({ error: "Quiz not found" }, { status: 404 })
  }
  if (quiz.userId !== dbUser.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { answers } = parsed.data

  // Grade each answer
  const gradedAnswers = await Promise.all(
    quiz.questions.map(async (question) => {
      const submitted = answers.find((a) => a.questionId === question.id)
      const userAnswer = submitted?.userAnswer ?? ""

      if (
        question.questionType === "SHORT_ANSWER" ||
        question.questionType === "CODE_READING"
      ) {
        const feedbackResult = await getAnswerFeedback({
          questionText: question.questionText,
          correctAnswer: question.correctAnswer,
          userAnswer,
          topicTitle: quiz.topic.title,
        })
        await db.aiInteraction.create({
          data: {
            userId: dbUser.id,
            topicId: quiz.topicId,
            interactionType: "ANSWER_FEEDBACK",
            prompt: `Q: ${question.questionText}\nCorrect: ${question.correctAnswer}\nUser: ${userAnswer}`,
            response: JSON.stringify(feedbackResult),
            modelUsed: AI_MODEL,
          },
        })
        return {
          questionId: question.id,
          userAnswer,
          isCorrect: feedbackResult.isCorrect,
          feedback: feedbackResult.feedback,
          score: feedbackResult.score,
        }
      }

      // Multiple choice and debugging — exact string match
      const isCorrect =
        userAnswer.trim().toLowerCase() ===
        question.correctAnswer.trim().toLowerCase()
      return {
        questionId: question.id,
        userAnswer,
        isCorrect,
        feedback: isCorrect
          ? "Correct!"
          : `The correct answer is: ${question.correctAnswer}. ${question.explanation}`,
        score: isCorrect ? 1 : 0,
      }
    })
  )

  const totalScore =
    gradedAnswers.reduce((sum, a) => sum + a.score, 0) / quiz.questions.length
  const scorePercent = Math.round(totalScore * 100)

  // Save attempt + answers
  const attempt = await db.quizAttempt.create({
    data: {
      quizId,
      userId: dbUser.id,
      score: scorePercent,
      totalQuestions: quiz.questions.length,
      completedAt: new Date(),
      answers: {
        create: gradedAnswers.map((a) => ({
          questionId: a.questionId,
          userAnswer: a.userAnswer,
          isCorrect: a.isCorrect,
          feedback: a.feedback,
        })),
      },
    },
    select: { id: true },
  })

  // Update UserTopicProgress mastery score
  const existing = await db.userTopicProgress.findUnique({
    where: { userId_topicId: { userId: dbUser.id, topicId: quiz.topicId } },
  })

  if (existing) {
    const newCompleted = existing.quizzesCompleted + 1
    const newAvg =
      (existing.averageQuizScore * existing.quizzesCompleted + scorePercent) /
      newCompleted
    const masteryScore = Math.min(
      100,
      newAvg * 0.5 +
        Math.min(existing.totalStudyMinutes / 60, 100) * 0.3 +
        Math.min(newCompleted * 10, 100) * 0.2
    )
    await db.userTopicProgress.update({
      where: { userId_topicId: { userId: dbUser.id, topicId: quiz.topicId } },
      data: {
        quizzesCompleted: newCompleted,
        averageQuizScore: Math.round(newAvg),
        masteryScore: Math.round(masteryScore),
        status:
          masteryScore >= 80
            ? "MASTERED"
            : masteryScore >= 40
              ? "IN_PROGRESS"
              : "NEEDS_REVIEW",
        lastStudiedAt: new Date(),
      },
    })
  } else {
    const masteryScore = Math.min(100, scorePercent * 0.5)
    await db.userTopicProgress.create({
      data: {
        userId: dbUser.id,
        topicId: quiz.topicId,
        quizzesCompleted: 1,
        averageQuizScore: scorePercent,
        masteryScore: Math.round(masteryScore),
        status:
          masteryScore >= 80
            ? "MASTERED"
            : masteryScore >= 40
              ? "IN_PROGRESS"
              : "NEEDS_REVIEW",
        lastStudiedAt: new Date(),
      },
    })
  }

  return Response.json({ attemptId: attempt.id, score: scorePercent })
}
