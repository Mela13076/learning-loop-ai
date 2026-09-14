import { isMockMode } from "./config"
import { generateJson } from "./client"
import type { AiUsageMetadata } from "./client"
import { parseFeedbackResponse } from "./feedback-schema"

export interface FeedbackInput {
  questionText: string
  correctAnswer: string
  userAnswer: string
  topicTitle: string
  questionType?: "SHORT_ANSWER" | "CODE_READING"
}

export interface FeedbackResponse {
  isCorrect: boolean
  isPartiallyCorrect: boolean
  feedback: string
  score: 0 | 0.5 | 1
  usage?: AiUsageMetadata
}

function getMockFeedback(input: FeedbackInput): FeedbackResponse {
  // Preserve case and internal spacing for code output. Short-answer fixtures
  // tolerate capitalization and whitespace, but do not attempt semantic grading.
  const normalize = (answer: string) => input.questionType === "CODE_READING"
    ? answer.trim()
    : answer.trim().replace(/\s+/g, " ").toLowerCase()
  const answer = normalize(input.userAnswer)
  const isCorrect = answer.length > 0 && answer === normalize(input.correctAnswer)

  return {
    isCorrect,
    isPartiallyCorrect: false,
    feedback: isCorrect
      ? "Correct! Your answer matches the expected answer."
      : answer.length === 0
        ? `No answer was provided. The expected answer is: ${input.correctAnswer}.`
        : `Your answer does not match the expected answer: ${input.correctAnswer}.`,
    score: isCorrect ? 1 : 0,
  }
}

async function getRealFeedback(
  input: FeedbackInput
): Promise<FeedbackResponse> {
  const systemPrompt = `You are a fair quiz grader for a CS learning platform. Evaluate the student's answer.

Topic: ${input.topicTitle}
Question: ${input.questionText}
Correct answer: ${input.correctAnswer}

Rules:
- isCorrect: true only if the student's answer captures the core meaning accurately
- isPartiallyCorrect: true if the answer shows understanding but is incomplete or imprecise
- score: 1 for correct, 0.5 for partially correct, 0 for incorrect
- Flags must agree with score: 1 means isCorrect=true and isPartiallyCorrect=false;
  0.5 means isCorrect=false and isPartiallyCorrect=true; 0 means both flags are false
- feedback: 1-2 sentences explaining what was right or wrong — encouraging tone, never harsh
- Return ONLY valid JSON matching this exact shape:
{
  "isCorrect": boolean,
  "isPartiallyCorrect": boolean,
  "feedback": "string",
  "score": 0 | 0.5 | 1
}`

  let usage: AiUsageMetadata | undefined
  const text = await generateJson({
    prompt: `Student answer: ${input.userAnswer}`,
    systemInstruction: systemPrompt,
    maxOutputTokens: 512,
    onUsage: (metadata) => { usage = metadata },
  })

  return { ...parseFeedbackResponse(text), usage }
}

export async function getAnswerFeedback(
  input: FeedbackInput
): Promise<FeedbackResponse> {
  if (isMockMode) {
    return getMockFeedback(input)
  }
  return getRealFeedback(input)
}
