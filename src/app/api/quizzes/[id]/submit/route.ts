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

  if (existing) {
    const newCompleted = existing.quizzesCompleted + 1
    const newAvg =
      (existing.averageQuizScore * existing.quizzesCompleted + scorePercent) /
      newCompleted
    const mastery = computeTopicMastery({
      averageQuizScore: newAvg,
      coveredConceptCount: coveredConceptTitles.length,
      finalQuizPassed: passedFinalQuiz,
      quizzesCompleted: newCompleted,
      topicEstimatedMinutes: quiz.topic.estimatedMinutes,
      totalConceptCount: topicConceptTitles.length,
      totalStudyMinutes: existing.totalStudyMinutes,
    })
    await db.userTopicProgress.update({
      where: { userId_topicId: { userId: dbUser.id, topicId: quiz.topicId } },
      data: {
        coveredConceptTitles,
        finalQuizPassed: passedFinalQuiz,
        finalQuizPassedAt,
        quizzesCompleted: newCompleted,
        averageQuizScore: Math.round(newAvg),
        masteryScore: mastery.masteryScore,
        status: mastery.status,
        lastStudiedAt: new Date(),
      },
    })
  } else {
    const mastery = computeTopicMastery({
      averageQuizScore: scorePercent,
      coveredConceptCount: 0,
      finalQuizPassed: passedFinalQuiz,
      quizzesCompleted: 1,
      topicEstimatedMinutes: quiz.topic.estimatedMinutes,
      totalConceptCount: topicConceptTitles.length,
      totalStudyMinutes: 0,
    })
    await db.userTopicProgress.create({
      data: {
        userId: dbUser.id,
        topicId: quiz.topicId,
        coveredConceptTitles: [],
        finalQuizPassed: passedFinalQuiz,
        finalQuizPassedAt,
        quizzesCompleted: 1,
        averageQuizScore: scorePercent,
        masteryScore: mastery.masteryScore,
        status: mastery.status,
        lastStudiedAt: new Date(),
      },
    })
  }

  return Response.json({ attemptId: attempt.id, score: scorePercent })
}
