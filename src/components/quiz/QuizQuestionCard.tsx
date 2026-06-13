"use client"

interface QuizQuestionCardProps {
  questionNumber: number
  totalQuestions: number
  questionText: string
  questionType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "CODE_READING" | "DEBUGGING"
  options: string[]
  currentAnswer: string
  onChange: (answer: string) => void
}

export function QuizQuestionCard({
  questionNumber,
  totalQuestions,
  questionText,
  questionType,
  options,
  currentAnswer,
  onChange,
}: QuizQuestionCardProps) {
  const isCodeQuestion =
    questionType === "CODE_READING" || questionType === "DEBUGGING"

  // Extract code block from question text if present (```...```)
  const codeMatch = /```(?:\w+)?\n([\s\S]*?)```/.exec(questionText)
  const codeBlock = codeMatch?.[1] ?? null
  const questionWithoutCode = codeBlock
    ? questionText.replace(/```(?:\w+)?\n[\s\S]*?```/, "").trim()
    : questionText

  const TYPE_LABEL: Record<QuizQuestionCardProps["questionType"], string> = {
    MULTIPLE_CHOICE: "Multiple Choice",
    SHORT_ANSWER: "Short Answer",
    CODE_READING: "Code Reading",
    DEBUGGING: "Find the Bug",
  }

  return (
    <div className="space-y-6">
      {/* Progress + type */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Question {questionNumber} of {totalQuestions}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {TYPE_LABEL[questionType]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-300"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Code block (for code_reading / debugging) */}
      {isCodeQuestion && codeBlock && (
        <pre className="overflow-x-auto rounded-lg bg-gray-950 p-4 text-sm font-mono text-gray-100 dark:bg-black">
          <code>{codeBlock}</code>
        </pre>
      )}

      {/* Question text */}
      <p className="text-base font-medium leading-relaxed">
        {questionWithoutCode}
      </p>

      {/* Answer area */}
      {questionType === "SHORT_ANSWER" ? (
        <textarea
          value={currentAnswer}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here…"
          rows={4}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      ) : (
        <div className="space-y-2.5">
          {options.map((option, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                currentAnswer === option
                  ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                  : "border-border hover:border-teal-300 hover:bg-muted/40"
              }`}
            >
              <input
                type="radio"
                name={`question-${questionNumber}`}
                value={option}
                checked={currentAnswer === option}
                onChange={() => onChange(option)}
                className="mt-0.5 accent-teal-600"
              />
              <span className="text-sm leading-relaxed">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
