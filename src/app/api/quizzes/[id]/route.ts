import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) {
    return Response.json({ error: "User not found" }, { status: 404 })
  }

  const quiz = await db.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
      },
      topic: { select: { id: true, title: true } },
    },
  })

  if (!quiz) {
    return Response.json({ error: "Quiz not found" }, { status: 404 })
  }

  if (quiz.userId !== dbUser.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  return Response.json(quiz)
}
