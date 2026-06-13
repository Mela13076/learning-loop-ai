interface SummaryData {
  summary: string
  keyTakeaways: string[]
  weakAreas: string[]
  recommendedNext: string
}

interface SessionSummaryCardProps {
  summary: SummaryData
  topicId?: string
  topicTitle?: string
}

export function SessionSummaryCard({
  summary,
  topicId,
  topicTitle,
}: SessionSummaryCardProps) {
  return (
    <div className="space-y-5 rounded-2xl border border-primary/20 bg-[var(--accent-soft)]/60 p-6 text-left">
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
          AI
        </span>
        <h3 className="font-semibold">Session Summary</h3>
      </div>

      {/* Summary paragraph */}
      <p className="text-sm leading-relaxed text-foreground">{summary.summary}</p>

      {/* Key takeaways */}
      {summary.keyTakeaways.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Key Takeaways
          </p>
          <ul className="space-y-1.5">
            {summary.keyTakeaways.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-primary">→</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weak areas */}
      {summary.weakAreas.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Review These
          </p>
          <ul className="space-y-1.5">
            {summary.weakAreas.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-yellow-500">!</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended next */}
      {summary.recommendedNext && (
        <div className="rounded-lg bg-background/70 px-4 py-3 dark:bg-background/30">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What to Study Next
          </p>
          <p className="text-sm">{summary.recommendedNext}</p>
          {topicId && (
            <a
              href={`/topics/${topicId}`}
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              Continue with {topicTitle ?? "this topic"} →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
