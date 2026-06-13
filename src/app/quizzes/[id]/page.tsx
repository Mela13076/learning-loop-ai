import { currentUser } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { QuizTaker } from "@/components/quiz/QuizTaker"

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const clerkUser = await currentUser()
  if (!clerkUser) redirect("/login")

  const { id } = await params

  const dbUser = await db.user.findUnique({ where: { clerkId: clerkUser.id } })
  if (!dbUser) redirect("/login")

  const quiz = await db.quiz.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      topic: { select: { title: true } },
    },
  })

  if (!quiz) notFound()
  if (quiz.userId !== dbUser.id) notFound()

  return (
    <QuizTaker
      quizId={quiz.id}
      title={quiz.title}
      topicTitle={quiz.topic.title}
      questions={quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        orderIndex: q.orderIndex,
      }))}
    />
  )
}
