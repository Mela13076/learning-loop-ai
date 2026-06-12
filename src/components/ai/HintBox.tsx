"use client"

interface HintBoxProps {
  type: "explanation" | "hint" | "example" | "answer"
  content: string
  guidingQuestion?: string
}

const TYPE_STYLES: Record<
  HintBoxProps["type"],
  { borderClass: string; labelClass: string; label: string }
> = {
  explanation: {
    borderClass: "border-l-blue-400",
    labelClass: "text-blue-600 dark:text-blue-400",
    label: "Explanation",
  },
  hint: {
    borderClass: "border-l-yellow-400",
    labelClass: "text-yellow-600 dark:text-yellow-400",
    label: "Hint",
  },
  example: {
    borderClass: "border-l-purple-400",
    labelClass: "text-purple-600 dark:text-purple-400",
    label: "Example",
  },
  answer: {
    borderClass: "border-l-green-400",
    labelClass: "text-green-600 dark:text-green-400",
    label: "Answer",
  },
}

export function HintBox({ type, content, guidingQuestion }: HintBoxProps) {
  const styles = TYPE_STYLES[type]

  return (
    <div
      className={`border-l-4 ${styles.borderClass} rounded-r-lg bg-muted/40 p-4 space-y-2`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wider ${styles.labelClass}`}>
        {styles.label}
      </p>
      <p className="text-sm leading-relaxed">{content}</p>
      {guidingQuestion && (
        <p className="text-sm text-muted-foreground italic mt-2">
          {guidingQuestion}
        </p>
      )}
    </div>
  )
}
