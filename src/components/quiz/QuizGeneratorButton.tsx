"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface QuizGeneratorButtonProps {
  topicId: string
}

type Difficulty = "beginner" | "intermediate" | "advanced"
type QuestionCount = 5 | 10 | 15
type QuestionType = "multiple_choice" | "short_answer" | "mixed"

export function QuizGeneratorButton({ topicId }: QuizGeneratorButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner")
  const [questionCount, setQuestionCount] = useState<QuestionCount>(5)
  const [questionType, setQuestionType] = useState<QuestionType>("multiple_choice")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, difficulty, questionCount, questionType }),
      })
      const data = (await res.json()) as { quizId?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Failed to generate quiz")
      router.push(`/quizzes/${data.quizId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        Generate Quiz
      </Button>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <h3 className="font-semibold text-sm">Quiz Settings</h3>

      {/* Difficulty */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground font-medium">Difficulty</label>
        <div className="flex gap-2">
          {(["beginner", "intermediate", "advanced"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex-1 rounded-md border px-2 py-1.5 text-xs capitalize transition-colors ${
                difficulty === d
                  ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                  : "border-border text-muted-foreground hover:border-teal-400"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Question count */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground font-medium">Questions</label>
        <div className="flex gap-2">
          {([5, 10, 15] as QuestionCount[]).map((n) => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                questionCount === n
                  ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                  : "border-border text-muted-foreground hover:border-teal-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Question type */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground font-medium">Type</label>
        <div className="flex gap-2">
          {(["multiple_choice", "short_answer", "mixed"] as QuestionType[]).map((t) => (
            <button
              key={t}
              onClick={() => setQuestionType(t)}
              className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                questionType === t
                  ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                  : "border-border text-muted-foreground hover:border-teal-400"
              }`}
            >
              {t === "multiple_choice" ? "MC" : t === "short_answer" ? "Short" : "Mixed"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => { setOpen(false); setError(null) }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-teal-600 text-white hover:bg-teal-700"
          onClick={() => void handleGenerate()}
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate"}
        </Button>
      </div>
    </div>
  )
}
