import { z } from "zod"
import type { FeedbackResponse } from "./feedback"

const feedback = z.string().refine((text) => text.trim().length > 0)
const feedbackSchema = z.union([
  z.strictObject({
    score: z.literal(1), isCorrect: z.literal(true),
    isPartiallyCorrect: z.literal(false), feedback,
  }),
  z.strictObject({
    score: z.literal(0.5), isCorrect: z.literal(false),
    isPartiallyCorrect: z.literal(true), feedback,
  }),
  z.strictObject({
    score: z.literal(0), isCorrect: z.literal(false),
    isPartiallyCorrect: z.literal(false), feedback,
  }),
])

export class InvalidFeedbackResponseError extends Error {
  constructor() {
    super("The AI returned invalid grading feedback. Your quiz results were not saved. Please submit again.")
    this.name = "InvalidFeedbackResponseError"
  }
}

export function parseFeedbackResponse(text: string): FeedbackResponse {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new InvalidFeedbackResponseError()
  }
  const parsed = feedbackSchema.safeParse(value)
  if (!parsed.success) throw new InvalidFeedbackResponseError()
  return parsed.data
}
