interface AnswerWithQuestion {
  id: string
  userAnswer: string
  isCorrect: boolean
  feedback: string | null
  question: {
    id: string
    questionText: string
    questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "CODE_READING" | "DEBUGGING"
    options: string[]
    correctAnswer: string
    explanation: string
    orderIndex: number
  }
}

interface QuizResultsSummaryProps {
  quizTitle: string
  topicTitle: string
  score: number
  totalQuestions: number
  answers: AnswerWithQuestion[]
}

const TYPE_LABEL: Record<AnswerWithQuestion["question"]["questionType"], string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  SHORT_ANSWER: "Short Answer",
  CODE_READING: "Code Reading",
  DEBUGGING: "Find the Bug",
}

const CODE_BLOCK_RE = /```(?:\w+)?\n([\s\S]*?)```/

function extractCode(text: string): { code: string | null; text: string } {
  const match = CODE_BLOCK_RE.exec(text)
  if (!match) return { code: null, text }
  return {
    code: match[1],
    text: text.replace(CODE_BLOCK_RE, "").trim(),
  }
}

export function QuizResultsSummary({
  quizTitle,
  topicTitle,
  score,
  totalQuestions,
  answers,
}: QuizResultsSummaryProps) {
  const correctCount = answers.filter((a) => a.isCorrect).length
  const incorrectAnswers = answers.filter((a) => !a.isCorrect)

  const scoreColor =
    score >= 80
      ? "text-teal-500 dark:text-teal-400"
      : score >= 40
        ? "text-yellow-500 dark:text-yellow-400"
        : "text-red-500 dark:text-red-400"

  const scoreBg =
    score >= 80
      ? "bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800"
      : score >= 40
        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
        : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"

  const scoreLabel =
    score >= 80 ? "Great work!" : score >= 40 ? "Keep practicing!" : "More review needed"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">{topicTitle}</p>
        <h1 className="mt-1 text-2xl font-bold">{quizTitle}</h1>
      </div>

      {/* Score card */}
      <div className={`rounded-xl border p-6 text-center ${scoreBg}`}>
        <p className={`text-7xl font-extrabold tabular-nums ${scoreColor}`}>
          {Math.round(score)}%
        </p>
        <p className="mt-2 text-lg font-semibold text-foreground">
          {correctCount} / {totalQuestions} correct
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{scoreLabel}</p>
      </div>

      {/* Areas to review */}
      {incorrectAnswers.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Areas to Review ({incorrectAnswers.length})
          </h2>
          <ul className="space-y-1.5">
            {incorrectAnswers.map((a, i) => {
              const { text } = extractCode(a.question.questionText)
              return (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 shrink-0 text-red-500">✗</span>
                  <span className="text-muted-foreground line-clamp-1">
                    Q{answers.indexOf(a) + 1}: {text}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Per-question breakdown */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Question Breakdown</h2>
        <div className="space-y-4">
          {answers.map((answer, i) => {
            const { code, text } = extractCode(answer.question.questionText)
            const isCodeQuestion =
              answer.question.questionType === "CODE_READING" ||
              answer.question.questionType === "DEBUGGING"

            return (
              <div
                key={answer.id}
                className={`rounded-xl border p-5 ${
                  answer.isCorrect
                    ? "border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-900/10"
                    : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10"
                }`}
              >
                {/* Question header */}
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold ${answer.isCorrect ? "text-teal-600 dark:text-teal-400" : "text-red-500"}`}
                    >
                      {answer.isCorrect ? "✓" : "✗"}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      Question {i + 1}
                    </span>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {TYPE_LABEL[answer.question.questionType]}
                  </span>
                </div>

                {/* Code block */}
                {isCodeQuestion && code && (
                  <pre className="mb-3 overflow-x-auto rounded-lg bg-gray-950 p-3.5 text-sm font-mono text-gray-100 dark:bg-black">
                    <code>{code}</code>
                  </pre>
                )}

                {/* Question text */}
                <p className="mb-4 text-sm leading-relaxed text-foreground">{text}</p>

                <div className="space-y-2 text-sm">
                  {/* User's answer */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="font-medium text-muted-foreground">Your answer:</span>
                    <span
                      className={
                        answer.isCorrect
                          ? "text-teal-700 dark:text-teal-300"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {answer.userAnswer || "(no answer)"}
                    </span>
                  </div>

                  {/* Correct answer (only if wrong) */}
                  {!answer.isCorrect && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="font-medium text-muted-foreground">Correct answer:</span>
                      <span className="text-teal-700 dark:text-teal-300">
                        {answer.question.correctAnswer}
                      </span>
                    </div>
                  )}

                  {/* Feedback / explanation */}
                  {(answer.feedback ?? answer.question.explanation) && (
                    <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-muted-foreground">
                      {answer.feedback ?? answer.question.explanation}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
