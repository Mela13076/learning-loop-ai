import { z } from "zod"
import type { GeneratedQuiz, QuizInput } from "./quiz"

const nonEmptyText = z.string().refine((text) => text.trim().length > 0)
const questionSchema = z.strictObject({
  questionText: nonEmptyText,
  questionType: z.enum(["multiple_choice", "short_answer", "code_reading", "debugging"]),
  options: z.array(nonEmptyText).length(4).optional(),
  correctAnswer: nonEmptyText,
  explanation: nonEmptyText,
  orderIndex: z.number().int().positive(),
}).superRefine((question, ctx) => {
  if (question.questionType === "short_answer") {
    if (question.options !== undefined) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Short answers must not have choices" })
    }
    return
  }

  if (!question.options) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Choices are required" })
    return
  }
  const normalized = question.options.map((option) =>
    question.questionType === "code_reading" ? option.trim() : option.trim().toLowerCase(),
  )
  if (new Set(normalized).size !== 4) {
    ctx.addIssue({ code: "custom", path: ["options"], message: "Choices must be distinct" })
  }
  if (!question.options.includes(question.correctAnswer)) {
    ctx.addIssue({ code: "custom", path: ["correctAnswer"], message: "Answer must match a choice" })
  }
})

export class InvalidQuizResponseError extends Error {
  constructor() {
    super("The AI returned an invalid quiz. No quiz was saved. Please try again.")
    this.name = "InvalidQuizResponseError"
  }
}

export function parseGeneratedQuiz(text: string, input: QuizInput): GeneratedQuiz {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new InvalidQuizResponseError()
  }

  const schema = z.strictObject({
    questions: z.array(questionSchema).length(input.questionCount),
  }).superRefine((quiz, ctx) => {
    quiz.questions.forEach((question, index) => {
      if (question.orderIndex !== index + 1) {
        ctx.addIssue({ code: "custom", path: ["questions", index, "orderIndex"], message: "Questions must be ordered from 1" })
      }
      if (input.questionType !== "mixed" && question.questionType !== input.questionType) {
        ctx.addIssue({ code: "custom", path: ["questions", index, "questionType"], message: "Question type must match the request" })
      }
    })
  })
  const result = schema.safeParse(value)
  if (!result.success) throw new InvalidQuizResponseError()
  return result.data
}
