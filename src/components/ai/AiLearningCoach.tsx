"use client"

import { useState } from "react"
import { Brain, CheckCircle2, Lightbulb, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { KeyConcept } from "@/lib/topic-content"
import type {
  LearningCoachNextAction,
  LearningCoachQuizResponse,
  LearningCoachResponse,
} from "@/lib/ai/coach-types"

interface AiLearningCoachProps {
  topicId: string
  topicTitle: string
  concepts: KeyConcept[]
}

const LESSON_STYLES = {
  intro: {
    label: "Quick Start",
    icon: Sparkles,
    className: "border-sky-400/60 bg-sky-50/70 text-sky-900 dark:bg-sky-950/20 dark:text-sky-100",
    badgeClass: "text-sky-700 dark:text-sky-300",
  },
  explanation: {
    label: "Explanation",
    icon: Brain,
    className: "border-blue-400/60 bg-blue-50/70 text-blue-950 dark:bg-blue-950/20 dark:text-blue-100",
    badgeClass: "text-blue-700 dark:text-blue-300",
  },
  example: {
    label: "Example",
    icon: Lightbulb,
    className: "border-emerald-400/60 bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100",
    badgeClass: "text-emerald-700 dark:text-emerald-300",
  },
  hint: {
    label: "Hint",
    icon: Lightbulb,
    className: "border-amber-400/60 bg-amber-50/70 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100",
    badgeClass: "text-amber-700 dark:text-amber-300",
  },
  correct: {
    label: "Correct",
    icon: CheckCircle2,
    className: "border-green-400/60 bg-green-50/70 text-green-950 dark:bg-green-950/20 dark:text-green-100",
    badgeClass: "text-green-700 dark:text-green-300",
  },
  incorrect: {
    label: "Try Again",
    icon: RotateCcw,
    className: "border-rose-400/60 bg-rose-50/70 text-rose-950 dark:bg-rose-950/20 dark:text-rose-100",
    badgeClass: "text-rose-700 dark:text-rose-300",
  },
} as const

const ACTION_LABELS: Record<LearningCoachNextAction, string> = {
  explain: "Explain Concept",
  example: "Show Example",
  quiz: "Quiz Me",
  hint: "Show Hint",
  "try-again": "Try Again",
  "change-concept": "Change Concept",
  "finish-session": "Finish Session",
}

type CoachActionPayload = {
  action: "start" | "explain" | "example" | "quiz" | "hint" | "answer"
  interactionId?: string
  selectedAnswer?: string
}

type ContentSegment =
  | { type: "text"; value: string }
  | { type: "code"; language: string; value: string }

function parseContent(content: string): ContentSegment[] {
  const pattern = /```(\w+)?\n([\s\S]*?)```/g
  const segments: ContentSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index).trim()
    if (before) {
      segments.push({ type: "text", value: before })
    }

    segments.push({
      type: "code",
      language: match[1] ?? "",
      value: match[2].trimEnd(),
    })

    lastIndex = pattern.lastIndex
  }

  const after = content.slice(lastIndex).trim()
  if (after) {
    segments.push({ type: "text", value: after })
  }

  return segments.length > 0 ? segments : [{ type: "text", value: content }]
}

function RichContent({ content }: { content: string }) {
  const segments = parseContent(content)

  return (
    <div className="space-y-4 text-sm leading-7">
      {segments.map((segment, index) =>
        segment.type === "text" ? (
          <div key={`${segment.type}-${index}`} className="space-y-3">
            {segment.value.split(/\n{2,}/).map((paragraph, paragraphIndex) => (
              <p
                key={`${index}-${paragraphIndex}`}
                className="whitespace-pre-wrap text-foreground"
              >
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <div
            key={`${segment.type}-${index}`}
            className="overflow-hidden rounded-xl border border-primary/20 bg-slate-950"
          >
            {segment.language && (
              <div className="border-b border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                {segment.language}
              </div>
            )}
            <pre className="overflow-x-auto p-4 text-sm text-slate-100">
              <code>{segment.value}</code>
            </pre>
          </div>
        )
      )}
    </div>
  )
}

function CoachLessonCard({
  response,
  onAction,
  loading,
}: {
  response: Extract<LearningCoachResponse, { type: "lesson" }>
  onAction: (action: LearningCoachNextAction) => void
  loading: boolean
}) {
  const style = LESSON_STYLES[response.lessonType]
  const Icon = style.icon

  return (
    <div className={`rounded-2xl border p-5 ${style.className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${style.badgeClass}`}>
            <Icon className="size-4" />
            {style.label}
          </div>
          <h3 className="text-xl font-semibold">{response.title}</h3>
        </div>
      </div>

      <div className="mt-4">
        <RichContent content={response.content} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {response.nextActions.map((action) => (
          <Button
            key={action}
            variant={action === "finish-session" ? "outline" : "secondary"}
            onClick={() => onAction(action)}
            disabled={loading}
          >
            {ACTION_LABELS[action]}
          </Button>
        ))}
      </div>
    </div>
  )
}

function CoachQuizCard({
  response,
  selectedAnswer,
  onSelectAnswer,
  onSubmit,
  onAction,
  loading,
}: {
  response: LearningCoachQuizResponse
  selectedAnswer: string
  onSelectAnswer: (value: string) => void
  onSubmit: () => void
  onAction: (action: LearningCoachNextAction) => void
  loading: boolean
}) {
  return (
    <div className="rounded-2xl border border-primary/50 bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        <Brain className="size-4" />
        Quiz Check
      </div>
      <h3 className="mt-2 text-xl font-semibold">{response.title}</h3>
      <p className="mt-4 text-base leading-7">{response.question}</p>

      <div className="mt-5 space-y-3">
        {response.options.map((option) => (
          <label
            key={option}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
              selectedAnswer === option
                ? "border-primary bg-[var(--accent-soft)]"
                : "border-primary/20 hover:border-primary/50 hover:bg-muted/40"
            }`}
          >
            <input
              type="radio"
              name={`coach-answer-${response.interactionId}`}
              value={option}
              checked={selectedAnswer === option}
              onChange={() => onSelectAnswer(option)}
              className="mt-1 accent-[var(--accent-strong)]"
              disabled={loading}
            />
            <span className="text-sm leading-6">{option}</span>
          </label>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onSubmit} disabled={loading || !selectedAnswer}>
          Submit Answer
        </Button>
        {response.nextActions.map((action) => (
          <Button
            key={action}
            variant="outline"
            onClick={() => onAction(action)}
            disabled={loading}
          >
            {ACTION_LABELS[action]}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function AiLearningCoach({
  topicId,
  topicTitle,
  concepts,
}: AiLearningCoachProps) {
  const [selectedConcept, setSelectedConcept] = useState<KeyConcept | null>(null)
  const [response, setResponse] = useState<LearningCoachResponse | null>(null)
  const [currentQuiz, setCurrentQuiz] = useState<LearningCoachQuizResponse | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [quizCounts, setQuizCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionComplete, setSessionComplete] = useState(false)

  async function runCoachAction(
    concept: KeyConcept,
    payload: CoachActionPayload
  ): Promise<void> {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          conceptTitle: concept.title,
          conceptDescription: concept.description,
          quizIndex:
            payload.action === "quiz" ? quizCounts[concept.title] ?? 0 : undefined,
          ...payload,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to load coach response")
      }

      const data = (await res.json()) as LearningCoachResponse
      setResponse(data)
      setSessionComplete(false)

      if (data.type === "quiz") {
        setCurrentQuiz(data)
        setSelectedAnswer("")
        setQuizCounts((prev) => ({
          ...prev,
          [concept.title]: (prev[concept.title] ?? 0) + 1,
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectConcept(concept: KeyConcept): Promise<void> {
    setSelectedConcept(concept)
    setResponse(null)
    setCurrentQuiz(null)
    setSelectedAnswer("")
    setSessionComplete(false)
    await runCoachAction(concept, { action: "start" })
  }

  async function handleSubmitAnswer(): Promise<void> {
    if (!selectedConcept || !currentQuiz || !selectedAnswer) return

    await runCoachAction(selectedConcept, {
      action: "answer",
      interactionId: currentQuiz.interactionId,
      selectedAnswer,
    })
  }

  async function handleNextAction(action: LearningCoachNextAction): Promise<void> {
    if (action === "change-concept") {
      setSelectedConcept(null)
      setResponse(null)
      setCurrentQuiz(null)
      setSelectedAnswer("")
      setSessionComplete(false)
      setError(null)
      return
    }

    if (action === "finish-session") {
      setSelectedConcept(null)
      setResponse(null)
      setCurrentQuiz(null)
      setSelectedAnswer("")
      setSessionComplete(true)
      setError(null)
      return
    }

    if (action === "try-again") {
      if (currentQuiz) {
        setResponse(currentQuiz)
        setSelectedAnswer("")
      }
      return
    }

    if (!selectedConcept) return

    if (action === "hint") {
      if (!currentQuiz) return
      await runCoachAction(selectedConcept, {
        action: "hint",
        interactionId: currentQuiz.interactionId,
      })
      return
    }

    await runCoachAction(selectedConcept, { action })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/20 bg-[var(--accent-soft)]/40 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="size-4" />
          AI Learning Coach
        </div>
        <h2 className="mt-2 text-2xl font-semibold">Learn one concept at a time</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Pick a key concept from {topicTitle}. The coach will explain it, show an
          example, and quiz you without turning the experience into an open chat.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {concepts.map((concept) => {
            const isActive = selectedConcept?.title === concept.title
            return (
              <Button
                key={concept.title}
                variant={isActive ? "default" : "outline"}
                onClick={() => void handleSelectConcept(concept)}
                disabled={loading}
              >
                {isActive ? `Learning ${concept.title}` : `Learn ${concept.title}`}
              </Button>
            )
          })}
        </div>
      </div>

      {!selectedConcept && !sessionComplete && (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-card/60 p-8 text-center">
          <h3 className="text-lg font-semibold">Choose a concept to begin</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Each concept session is designed to stay short: explain, practice, and
            check your understanding in a few focused steps.
          </p>
        </div>
      )}

      {sessionComplete && !selectedConcept && (
        <div className="rounded-2xl border border-primary/30 bg-card p-8 text-center">
          <h3 className="text-lg font-semibold">Session finished</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose another concept whenever you want to keep practicing.
          </p>
        </div>
      )}

      {selectedConcept && (
        <div className="rounded-2xl border border-primary/30 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Current concept
          </p>
          <h3 className="mt-2 text-xl font-semibold">{selectedConcept.title}</h3>
          {selectedConcept.description && (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {selectedConcept.description}
            </p>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-card p-5 text-sm text-muted-foreground">
          <span className="flex gap-1">
            <span className="size-2 animate-bounce rounded-full bg-muted-foreground/70" />
            <span className="size-2 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:120ms]" />
            <span className="size-2 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:240ms]" />
          </span>
          Building the next coaching step...
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {response?.type === "lesson" && (
        <CoachLessonCard
          response={response}
          onAction={(action) => void handleNextAction(action)}
          loading={loading}
        />
      )}

      {response?.type === "quiz" && (
        <CoachQuizCard
          response={response}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={setSelectedAnswer}
          onSubmit={() => void handleSubmitAnswer()}
          onAction={(action) => void handleNextAction(action)}
          loading={loading}
        />
      )}
    </div>
  )
}
