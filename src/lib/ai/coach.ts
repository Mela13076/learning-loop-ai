import "server-only"

import Anthropic from "@anthropic-ai/sdk"
import { AI_MODEL, isMockMode } from "./config"
import { getMockConceptFlow, getMockQuizForIndex } from "./mock-learning-coach"
import type {
  LearningCoachContext,
  LearningCoachLessonResponse,
  LearningCoachNextAction,
  LearningCoachResponse,
  StoredCoachQuiz,
} from "./coach-types"

const client = isMockMode ? null : new Anthropic()

function lessonNextActions(
  lessonType: LearningCoachLessonResponse["lessonType"]
): LearningCoachNextAction[] {
  switch (lessonType) {
    case "intro":
      return ["explain", "example", "quiz", "change-concept", "finish-session"]
    case "explanation":
      return ["example", "quiz", "change-concept", "finish-session"]
    case "example":
      return ["explain", "quiz", "change-concept", "finish-session"]
    case "hint":
      return ["try-again", "explain", "change-concept"]
    case "correct":
      return ["quiz", "change-concept", "finish-session"]
    case "incorrect":
      return ["try-again", "hint", "explain", "change-concept"]
  }
}

function createLessonResponse(
  lessonType: LearningCoachLessonResponse["lessonType"],
  title: string,
  content: string
): LearningCoachLessonResponse {
  return {
    type: "lesson",
    lessonType,
    title,
    content,
    nextActions: lessonNextActions(lessonType),
  }
}

function createQuizResponse(
  quiz: StoredCoachQuiz,
  interactionId = ""
): LearningCoachResponse {
  return {
    type: "quiz",
    title: quiz.title,
    question: quiz.question,
    options: quiz.options,
    interactionId,
    nextActions: ["hint", "change-concept", "finish-session"],
  }
}

function parseTextResponse(text: string): { title: string; content: string } {
  const parsed = JSON.parse(text) as { title?: string; content?: string }
  if (!parsed.title || !parsed.content) {
    throw new Error("AI returned an invalid coach response")
  }
  return {
    title: parsed.title,
    content: parsed.content,
  }
}

function parseQuizResponse(text: string): StoredCoachQuiz {
  const parsed = JSON.parse(text) as StoredCoachQuiz
  if (
    !parsed.title ||
    !parsed.question ||
    !Array.isArray(parsed.options) ||
    parsed.options.length !== 4 ||
    !parsed.correctAnswer ||
    !parsed.hint ||
    !parsed.explanation ||
    !parsed.correctFeedback ||
    !parsed.incorrectFeedback
  ) {
    throw new Error("AI returned an invalid quiz payload")
  }
  return parsed
}

async function createRealLesson(
  context: LearningCoachContext,
  lessonType: "intro" | "explanation" | "example"
): Promise<LearningCoachLessonResponse> {
  if (!client) {
    throw new Error("Anthropic client unavailable")
  }

  const lessonInstructions: Record<typeof lessonType, string> = {
    intro:
      "Give a short, learner-friendly concept introduction in 2 to 4 sentences. Keep it compact and motivating, and do not turn it into a quiz yet.",
    explanation:
      "Give a deeper explanation of the concept in 1 short section. Explain what it is, when it matters, and how to reason about it.",
    example:
      "Give one practical example. If code helps, include a short fenced code block, then briefly explain why the example works.",
  }

  const systemPrompt = `You are an AI Learning Coach for Learning Loop AI.
You teach one concept at a time.

Topic: ${context.topicTitle}
Learning path: ${context.learningPathTitle}
Concept: ${context.conceptTitle}
${context.conceptDescription ? `Concept description: ${context.conceptDescription}` : ""}

Task:
${lessonInstructions[lessonType]}

Rules:
- Keep the response tightly scoped to the selected concept
- Prefer concrete language over abstract filler
- Do not mention being an AI model
- Return ONLY valid JSON with this exact shape:
{
  "title": "string",
  "content": "string"
}`

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 900,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Create a ${lessonType} response for ${context.conceptTitle}.`,
      },
    ],
  })

  const text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "{}"
  const parsed = parseTextResponse(text)

  return createLessonResponse(lessonType, parsed.title, parsed.content)
}

async function createRealQuiz(context: LearningCoachContext): Promise<StoredCoachQuiz> {
  if (!client) {
    throw new Error("Anthropic client unavailable")
  }

  const systemPrompt = `You are an AI Learning Coach for Learning Loop AI.
Create one multiple-choice quiz question for a learner studying a single concept.

Topic: ${context.topicTitle}
Learning path: ${context.learningPathTitle}
Concept: ${context.conceptTitle}
${context.conceptDescription ? `Concept description: ${context.conceptDescription}` : ""}

Rules:
- Return ONLY valid JSON
- The question must be specific to the concept
- Provide exactly 4 answer options
- The correctAnswer must exactly match one of the options
- The hint must guide the learner without revealing the answer
- The explanation should explain the correct answer and why the distractors are weaker
- Keep the difficulty beginner-to-intermediate
- Use this exact shape:
{
  "title": "string",
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctAnswer": "string",
  "hint": "string",
  "explanation": "string",
  "correctFeedback": "string",
  "incorrectFeedback": "string"
}`

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1200,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Generate one quiz question for ${context.conceptTitle}.`,
      },
    ],
  })

  const text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "{}"
  return parseQuizResponse(text)
}

export async function createLearningCoachResponse(input: {
  context: LearningCoachContext
  action: "start" | "explain" | "example" | "quiz"
  quizIndex?: number
}): Promise<{ response: LearningCoachResponse; storedQuiz?: StoredCoachQuiz }> {
  const { context, action, quizIndex = 0 } = input

  if (isMockMode) {
    const mockFlow = getMockConceptFlow(context)

    if (action === "start") {
      return {
        response: createLessonResponse("intro", context.conceptTitle, mockFlow.intro),
      }
    }

    if (action === "explain") {
      return {
        response: createLessonResponse(
          "explanation",
          `${context.conceptTitle} Explained`,
          mockFlow.explanation
        ),
      }
    }

    if (action === "example") {
      return {
        response: createLessonResponse(
          "example",
          `${context.conceptTitle} Example`,
          mockFlow.example
        ),
      }
    }

    const storedQuiz = getMockQuizForIndex(context, quizIndex)
    return {
      response: createQuizResponse(storedQuiz),
      storedQuiz,
    }
  }

  if (action === "quiz") {
    const storedQuiz = await createRealQuiz(context)
    return {
      response: createQuizResponse(storedQuiz),
      storedQuiz,
    }
  }

  const lessonType = action === "start" ? "intro" : action
  return {
    response: await createRealLesson(context, lessonType),
  }
}

export function createHintResponse(quiz: StoredCoachQuiz): LearningCoachLessonResponse {
  return createLessonResponse("hint", `${quiz.title} Hint`, quiz.hint)
}

export function evaluateQuizAnswer(input: {
  quiz: StoredCoachQuiz
  selectedAnswer: string
}): LearningCoachLessonResponse {
  const isCorrect = input.selectedAnswer.trim() === input.quiz.correctAnswer.trim()

  if (isCorrect) {
    return createLessonResponse(
      "correct",
      `${input.quiz.title} Result`,
      `${input.quiz.correctFeedback}\n\n${input.quiz.explanation}`
    )
  }

  return createLessonResponse(
    "incorrect",
    `${input.quiz.title} Result`,
    `${input.quiz.incorrectFeedback}\n\n${input.quiz.explanation}`
  )
}
