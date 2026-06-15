import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getAnswerFeedback } from "@/lib/ai/feedback"
import { AI_MODEL } from "@/lib/ai/config"
import { parseKeyConcepts } from "@/lib/topic-content"
import {
  computeTopicMastery,
  isPassingFinalMasteryQuiz,
  sanitizeCoveredConceptTitles,
} from "@/lib/topic-progress"

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
        topic: {
          select: { id: true, title: true, estimatedMinutes: true, keyConcepts: true },
        },
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
  const completedAt = new Date()

  const existingAttemptsForQuiz = await db.quizAttempt.findMany({
    where: {
      quizId,
      userId: dbUser.id,
    },
    orderBy: [{ completedAt: "desc" }, { startedAt: "desc" }],
    select: { id: true },
  })

  const attempt = existingAttemptsForQuiz[0]
    ? await db.quizAttempt.update({
        where: { id: existingAttemptsForQuiz[0].id },
        data: {
          score: scorePercent,
          totalQuestions: quiz.questions.length,
          startedAt: completedAt,
          completedAt,
          answers: {
            deleteMany: {},
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
    : await db.quizAttempt.create({
        data: {
          quizId,
          userId: dbUser.id,
          score: scorePercent,
          totalQuestions: quiz.questions.length,
          completedAt,
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

  const topicAttempts = await db.quizAttempt.findMany({
    where: {
      userId: dbUser.id,
      completedAt: { not: null },
      quiz: {
        topicId: quiz.topicId,
      },
    },
    orderBy: [{ completedAt: "desc" }, { startedAt: "desc" }],
    select: {
      quizId: true,
      score: true,
    },
  })

  const latestAttemptsByQuiz = new Map<string, { score: number }>()
  for (const topicAttempt of topicAttempts) {
    if (!latestAttemptsByQuiz.has(topicAttempt.quizId)) {
      latestAttemptsByQuiz.set(topicAttempt.quizId, {
        score: topicAttempt.score,
      })
    }
  }

  const uniqueCompletedQuizzes = latestAttemptsByQuiz.size
  const averageQuizScore =
    uniqueCompletedQuizzes > 0
      ? Math.round(
          Array.from(latestAttemptsByQuiz.values()).reduce(
            (sum, topicAttempt) => sum + topicAttempt.score,
            0
          ) / uniqueCompletedQuizzes
        )
      : 0

  // Update UserTopicProgress mastery score
  const existing = await db.userTopicProgress.findUnique({
    where: { userId_topicId: { userId: dbUser.id, topicId: quiz.topicId } },
  })
  const topicConceptTitles = parseKeyConcepts(quiz.topic.keyConcepts).map(
    (concept) => concept.title
  )
  const coveredConceptTitles = sanitizeCoveredConceptTitles({
    coveredConceptTitles: existing?.coveredConceptTitles ?? [],
    validConceptTitles: topicConceptTitles,
  })
  const passedFinalQuiz =
    (existing?.finalQuizPassed ?? false) ||
    isPassingFinalMasteryQuiz({
      difficulty: quiz.difficulty,
      questionCount: quiz.questionCount,
      scorePercent,
    })
  const finalQuizPassedAt =
    !(existing?.finalQuizPassed ?? false) && passedFinalQuiz ? new Date() : existing?.finalQuizPassedAt ?? null

  const mastery = computeTopicMastery({
    averageQuizScore,
    coveredConceptCount: coveredConceptTitles.length,
    finalQuizPassed: passedFinalQuiz,
    quizzesCompleted: uniqueCompletedQuizzes,
    topicEstimatedMinutes: quiz.topic.estimatedMinutes,
    totalConceptCount: topicConceptTitles.length,
    totalStudyMinutes: existing?.totalStudyMinutes ?? 0,
  })

  await db.userTopicProgress.upsert({
    where: { userId_topicId: { userId: dbUser.id, topicId: quiz.topicId } },
    create: {
      userId: dbUser.id,
      topicId: quiz.topicId,
      coveredConceptTitles,
      finalQuizPassed: passedFinalQuiz,
      finalQuizPassedAt,
      quizzesCompleted: uniqueCompletedQuizzes,
      averageQuizScore,
      masteryScore: mastery.masteryScore,
      status: mastery.status,
      lastStudiedAt: completedAt,
    },
    update: {
      coveredConceptTitles,
      finalQuizPassed: passedFinalQuiz,
      finalQuizPassedAt,
      quizzesCompleted: uniqueCompletedQuizzes,
      averageQuizScore,
      masteryScore: mastery.masteryScore,
      status: mastery.status,
      lastStudiedAt: completedAt,
    },
  })

  return Response.json({ attemptId: attempt.id, score: scorePercent })
}
