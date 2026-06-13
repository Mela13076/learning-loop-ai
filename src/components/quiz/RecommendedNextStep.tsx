import Link from "next/link"

interface RecommendedNextStepProps {
  topicId: string
  topicTitle: string
  nextTopic: { id: string; title: string } | null
  score: number
}

export function RecommendedNextStep({
  topicId,
  topicTitle,
  nextTopic,
  score,
}: RecommendedNextStepProps) {
  const suggestion =
    score >= 80
      ? nextTopic
        ? `You're ready to move on to ${nextTopic.title}.`
        : "You've mastered this topic!"
      : score >= 40
        ? "Consider reviewing this topic or asking the AI tutor for help."
        : "Try reviewing the topic and retaking the quiz."

  return (
    <div className="mt-10 rounded-xl border border-primary/50 bg-card p-6">
      <h2 className="mb-1 text-lg font-semibold">What to do next</h2>
      <p className="mb-5 text-sm text-muted-foreground">{suggestion}</p>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/topics/${topicId}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          Generate New Quiz
        </Link>

        <Link
          href={`/topics/${topicId}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          Review Topic
        </Link>

        <Link
          href={`/topics/${topicId}#ai-tutor`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          Ask AI Tutor
        </Link>

        {nextTopic && (
          <Link
            href={`/topics/${nextTopic.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Next Topic: {nextTopic.title} →
          </Link>
        )}
      </div>
    </div>
  )
}
