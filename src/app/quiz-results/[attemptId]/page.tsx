import { currentUser } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { QuizResultsSummary } from "@/components/quiz/QuizResultsSummary"
import { RecommendedNextStep } from "@/components/quiz/RecommendedNextStep"

export default async function QuizResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const clerkUser = await currentUser()
  if (!clerkUser) redirect("/login")

  const { attemptId } = await params

  const dbUser = await db.user.findUnique({ where: { clerkId: clerkUser.id } })
  if (!dbUser) redirect("/login")

  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          topic: {
            include: { learningPath: { select: { id: true, title: true } } },
          },
        },
      },
      answers: {
        include: { question: true },
      },
    },
  })

  if (!attempt) notFound()
  if (attempt.userId !== dbUser.id) notFound()

  // Sort answers by question orderIndex
  const sortedAnswers = [...attempt.answers].sort(
    (a, b) => a.question.orderIndex - b.question.orderIndex
  )

  const currentTopic = attempt.quiz.topic
  const progress = await db.userTopicProgress.findUnique({
    where: {
      userId_topicId: { userId: dbUser.id, topicId: currentTopic.id },
    },
    select: { masteryScore: true, status: true },
  })

  // Find next topic in the learning path
  const nextTopic = await db.topic.findFirst({
    where: {
      learningPathId: currentTopic.learningPathId,
      orderIndex: { gt: currentTopic.orderIndex },
    },
    orderBy: { orderIndex: "asc" },
    select: { id: true, title: true },
  })

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-primary/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-4 sm:px-6">
          <Link
            href={`/topics/${currentTopic.id}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to {currentTopic.title}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <QuizResultsSummary
          quizTitle={attempt.quiz.title}
          topicTitle={currentTopic.title}
          score={attempt.score}
          totalQuestions={attempt.totalQuestions}
          answers={sortedAnswers}
        />

        <RecommendedNextStep
          isMastered={progress?.status === "MASTERED"}
          masteryScore={Math.round(progress?.masteryScore ?? 0)}
          topicId={currentTopic.id}
          nextTopic={nextTopic}
        />
      </main>
    </div>
  )
}
