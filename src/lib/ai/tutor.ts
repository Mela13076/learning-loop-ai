import Anthropic from "@anthropic-ai/sdk"
import { isMockMode, AI_MODEL } from "./config"

export interface TutorInput {
  userQuestion: string
  topicTitle: string
  learningPathTitle: string
  attemptCount: number
  quizHistory?: string
}

export interface TutorResponse {
  type: "explanation" | "hint" | "example" | "answer"
  content: string
  showAnswerButton: boolean
  guidingQuestion?: string
}

const MOCK_RESPONSES: TutorResponse[] = [
  {
    type: "explanation",
    content:
      "Great question! Let's think through this together. This concept is central to how things work in this topic — understanding the underlying principle will make everything else click.",
    showAnswerButton: false,
    guidingQuestion:
      "Before I give you a hint, what do you already know about how this relates to what you've learned so far?",
  },
  {
    type: "hint",
    content:
      "Here's a small nudge: think about what the input and output of the process should be. What is the system trying to accomplish at each step?",
    showAnswerButton: false,
    guidingQuestion:
      "Can you describe in your own words what happens between the start and end of this operation?",
  },
  {
    type: "hint",
    content:
      "Let me give you a stronger hint. Think of it like a recipe — each ingredient matters and the order matters too. In computing, we often break problems down into smaller, sequential steps that each handle one responsibility.",
    showAnswerButton: false,
    guidingQuestion:
      "Which part of the process do you think is still tripping you up?",
  },
  {
    type: "example",
    content:
      "Here's a concrete example to make this real. Imagine you have a list of items and you need to find a specific one. You could check each item one by one (linear search) or, if the list is sorted, jump straight to the middle and narrow it down (binary search). The second approach is much faster for large lists. Does that pattern remind you of what we're working on?",
    showAnswerButton: false,
    guidingQuestion: "Can you try applying this idea to your original question?",
  },
  {
    type: "answer",
    content:
      "You've worked hard on this — here's the full explanation. The key insight is that the solution combines two ideas: first, breaking the problem into smaller sub-problems, and second, using the result of each sub-problem to build the final answer. This is a pattern you'll see again and again across many topics.",
    showAnswerButton: true,
  },
]

function getMockResponse(attemptCount: number): TutorResponse {
  const index = Math.min(attemptCount, MOCK_RESPONSES.length - 1)
  return MOCK_RESPONSES[index]
}

async function getRealResponse(input: TutorInput): Promise<TutorResponse> {
  const client = new Anthropic()

  const systemPrompt = `You are a friendly, encouraging tutor for the learning platform "Learning Loop AI".
Your role is to help students understand concepts without ever shaming them or giving away answers too quickly.

Topic: ${input.topicTitle}
Learning Path: ${input.learningPathTitle}
${input.quizHistory ? `Recent quiz misses: ${input.quizHistory}` : ""}

Rules:
- Never shame the student
- Never give the answer on attemptCount < 4
- Ask a guiding question first (attemptCount 0)
- Give progressively stronger hints as attemptCount increases
- attemptCount 0: explanation + guiding question
- attemptCount 1: small hint, encourage another attempt
- attemptCount 2: stronger hint with a related analogy
- attemptCount 3: concrete example, ask them to try with it
- attemptCount >= 4: you may reveal the full answer

Current attempt count: ${input.attemptCount}

Respond with ONLY valid JSON matching this exact shape:
{
  "type": "explanation" | "hint" | "example" | "answer",
  "content": "your response text",
  "showAnswerButton": true | false,
  "guidingQuestion": "optional follow-up question"
}

showAnswerButton must be true only when attemptCount >= 4.`

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: input.userQuestion,
      },
    ],
  })

  const text =
    message.content[0].type === "text" ? message.content[0].text : ""

  const parsed = JSON.parse(text) as TutorResponse
  parsed.showAnswerButton = input.attemptCount >= 4
  return parsed
}

export async function getTutorResponse(
  input: TutorInput
): Promise<TutorResponse> {
  if (isMockMode) {
    return getMockResponse(input.attemptCount)
  }
  return getRealResponse(input)
}
