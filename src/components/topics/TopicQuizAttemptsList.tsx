import Link from "next/link"
import type { Difficulty } from "@/generated/prisma/enums"

interface QuizAttemptEntry {
  id: string
  score: number
  totalQuestions: number
  completedAt: Date | null
  quiz: {
    id: string
    title: string
    difficulty: Difficulty
    questionCount: number
  }
}

interface TopicQuizAttemptsListProps {
  attempts: QuizAttemptEntry[]
}

const DIFFICULTY_BADGE: Record<
  Difficulty,
  { label: string; className: string }
> = {
  BEGINNER: {
    label: "Beginner",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  },
  ADVANCED: {
    label: "Advanced",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  },
}

function formatDate(date: Date | null): string {
  if (!date) return "In progress"

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function TopicQuizAttemptsList({
  attempts,
}: TopicQuizAttemptsListProps) {
  if (attempts.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        No quizzes taken for this topic yet.
      </p>
    )
  }

  return (
    <div className="max-h-100 space-y-4 overflow-y-auto pr-1">
      {attempts.map((attempt, index) => {
        const difficultyBadge = DIFFICULTY_BADGE[attempt.quiz.difficulty]

        return (
          <div key={attempt.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyBadge.className}`}
                  >
                    {difficultyBadge.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {attempt.quiz.questionCount} questions
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(attempt.completedAt)}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium leading-snug text-foreground">
                    {attempt.quiz.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Score: {Math.round(attempt.score)}% on {attempt.totalQuestions}{" "}
                    questions
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/quiz-results/${attempt.id}`}
                  className="inline-flex items-center justify-center rounded-lg border border-primary/50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  View results
                </Link>
                <Link
                  href={`/quizzes/${attempt.quiz.id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Retake
                </Link>
              </div>
            </div>

            {index < attempts.length - 1 && <hr className="mt-4 border-primary/50" />}
          </div>
        )
      })}
    </div>
  )
}
