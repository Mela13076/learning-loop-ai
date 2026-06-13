import Anthropic from "@anthropic-ai/sdk"
import { isMockMode, AI_MODEL } from "./config"

export interface FeedbackInput {
  questionText: string
  correctAnswer: string
  userAnswer: string
  topicTitle: string
}

export interface FeedbackResponse {
  isCorrect: boolean
  isPartiallyCorrect: boolean
  feedback: string
  score: 0 | 0.5 | 1
}

function getMockFeedback(): FeedbackResponse {
  return {
    isCorrect: true,
    isPartiallyCorrect: false,
    feedback:
      "Great job! Your answer captures the key idea. Keep applying this concept as you progress through the topic.",
    score: 1,
  }
}

async function getRealFeedback(
  input: FeedbackInput
): Promise<FeedbackResponse> {
  const client = new Anthropic()

  const systemPrompt = `You are a fair quiz grader for a CS learning platform. Evaluate the student's answer.

Topic: ${input.topicTitle}
Question: ${input.questionText}
Correct answer: ${input.correctAnswer}

Rules:
- isCorrect: true only if the student's answer captures the core meaning accurately
- isPartiallyCorrect: true if the answer shows understanding but is incomplete or imprecise
- score: 1 for correct, 0.5 for partially correct, 0 for incorrect
- feedback: 1-2 sentences explaining what was right or wrong — encouraging tone, never harsh
- Return ONLY valid JSON matching this exact shape:
{
  "isCorrect": boolean,
  "isPartiallyCorrect": boolean,
  "feedback": "string",
  "score": 0 | 0.5 | 1
}`

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Student answer: ${input.userAnswer}`,
      },
    ],
  })

  const text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "{}"

  return JSON.parse(text) as FeedbackResponse
}

export async function getAnswerFeedback(
  input: FeedbackInput
): Promise<FeedbackResponse> {
  if (isMockMode) {
    return getMockFeedback()
  }
  return getRealFeedback(input)
}
