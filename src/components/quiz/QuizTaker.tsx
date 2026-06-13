"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { QuizQuestionCard } from "./QuizQuestionCard"

interface Question {
  id: string
  questionText: string
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "CODE_READING" | "DEBUGGING"
  options: string[]
  orderIndex: number
}

interface QuizTakerProps {
  quizId: string
  title: string
  topicTitle: string
  questions: Question[]
}

export function QuizTaker({
  quizId,
  title,
  topicTitle,
  questions,
}: QuizTakerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = questions[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === questions.length - 1
  const currentAnswer = answers[currentQuestion.id] ?? ""
  const answeredCount = Object.values(answers).filter((a) => a.trim() !== "").length

  function setAnswer(answer: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: questions.map((q) => ({
            questionId: q.id,
            userAnswer: answers[q.id] ?? "",
          })),
        }),
      })
      const data = (await res.json()) as { attemptId?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Failed to submit quiz")
      router.push(`/quiz-results/${data.attemptId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-primary/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div>
            <p className="text-xs text-muted-foreground">{topicTitle}</p>
            <p className="font-semibold text-sm">{title}</p>
          </div>
          <span className="text-sm text-muted-foreground">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-primary/50 bg-card p-6 sm:p-8">
          <QuizQuestionCard
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            questionText={currentQuestion.questionText}
            questionType={currentQuestion.questionType}
            options={currentQuestion.options}
            currentAnswer={currentAnswer}
            onChange={setAnswer}
          />

          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => i - 1)}
              disabled={isFirst || submitting}
            >
              ← Previous
            </Button>

            <div className="flex gap-1.5">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`size-2 rounded-full transition-colors ${
                    i === currentIndex
                      ? "bg-primary"
                      : answers[questions[i].id]?.trim()
                        ? "bg-primary/40"
                        : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Go to question ${i + 1}`}
                />
              ))}
            </div>

            {isLast ? (
              <Button
                className=""
                onClick={() => void handleSubmit()}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit Quiz"}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentIndex((i) => i + 1)}
                disabled={submitting}
              >
                Next →
              </Button>
            )}
          </div>
        </div>

        {/* Question navigator */}
        <div className="mt-6 rounded-xl border border-primary/50 bg-card p-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            Jump to question
          </p>
          <div className="flex flex-wrap gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`size-8 rounded-md text-xs font-medium transition-colors ${
                  i === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : answers[questions[i].id]?.trim()
                      ? "border border-primary text-primary"
                      : "border border-primary/50 text-muted-foreground hover:border-primary/50"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
