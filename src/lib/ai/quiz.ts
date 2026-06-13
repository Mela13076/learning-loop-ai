import Anthropic from "@anthropic-ai/sdk"
import { isMockMode, AI_MODEL } from "./config"

export type QuizDifficulty = "beginner" | "intermediate" | "advanced"
export type QuizQuestionType = "multiple_choice" | "short_answer" | "mixed"
export type GeneratedQuestionType =
  | "multiple_choice"
  | "short_answer"
  | "code_reading"
  | "debugging"

export interface QuizInput {
  topicTitle: string
  learningPathTitle: string
  difficulty: QuizDifficulty
  questionCount: 5 | 10 | 15
  questionType: QuizQuestionType
}

export interface GeneratedQuestion {
  questionText: string
  questionType: GeneratedQuestionType
  options?: string[]
  correctAnswer: string
  explanation: string
  orderIndex: number
}

export interface GeneratedQuiz {
  questions: GeneratedQuestion[]
}

// ---------------------------------------------------------------------------
// Mock data — 5 realistic CS fundamentals questions
// ---------------------------------------------------------------------------

const MOCK_QUESTIONS: GeneratedQuestion[] = [
  {
    questionText:
      "What is the time complexity of searching for an element in an unsorted array?",
    questionType: "multiple_choice",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correctAnswer: "O(n)",
    explanation:
      "Searching an unsorted array requires checking each element one by one in the worst case, giving us linear time complexity O(n).",
    orderIndex: 1,
  },
  {
    questionText:
      "In your own words, explain what a function's return value is and why it matters.",
    questionType: "short_answer",
    correctAnswer:
      "A return value is the data a function sends back to the caller after completing its work. It matters because it lets functions produce results that other parts of the program can use.",
    explanation:
      "Functions can optionally send data back to the code that called them using a return statement. Without return values, functions can only produce side effects like printing to the screen.",
    orderIndex: 2,
  },
  {
    questionText: "What does the following code output?\n\n```js\nconst arr = [1, 2, 3];\nconsole.log(arr[arr.length - 1]);\n```",
    questionType: "code_reading",
    options: ["1", "2", "3", "undefined"],
    correctAnswer: "3",
    explanation:
      "`arr.length` is 3, so `arr.length - 1` is 2. `arr[2]` is the last element, which is `3`.",
    orderIndex: 3,
  },
  {
    questionText:
      "Which data structure uses LIFO (Last In, First Out) ordering?",
    questionType: "multiple_choice",
    options: ["Queue", "Stack", "Array", "Linked List"],
    correctAnswer: "Stack",
    explanation:
      "A stack processes items in Last In, First Out order — the most recently added item is the first to be removed. Think of a stack of plates.",
    orderIndex: 4,
  },
  {
    questionText:
      "What is wrong with this code?\n\n```python\ndef divide(a, b):\n    return a / b\n\nresult = divide(10, 0)\nprint(result)\n```",
    questionType: "debugging",
    options: [
      "The function name is invalid",
      "Division by zero will raise a ZeroDivisionError",
      "The return statement is missing a semicolon",
      "Variables a and b are not declared",
    ],
    correctAnswer: "Division by zero will raise a ZeroDivisionError",
    explanation:
      "Dividing by zero is undefined in mathematics and raises a `ZeroDivisionError` in Python. The fix is to check `if b == 0` before dividing.",
    orderIndex: 5,
  },
]

function getMockQuiz(input: QuizInput): GeneratedQuiz {
  const count = Math.min(input.questionCount, MOCK_QUESTIONS.length)
  const questions = MOCK_QUESTIONS.slice(0, count).map((q, i) => ({
    ...q,
    orderIndex: i + 1,
  }))
  return { questions }
}

// ---------------------------------------------------------------------------
// Real Anthropic implementation
// ---------------------------------------------------------------------------

const DIFFICULTY_GUIDANCE: Record<QuizDifficulty, string> = {
  beginner:
    "Questions should test basic definitions, simple syntax, and fundamental concepts. Avoid edge cases.",
  intermediate:
    "Questions should test applied understanding, common patterns, and problem-solving with familiar concepts.",
  advanced:
    "Questions should test deep understanding, trade-offs, edge cases, and optimization.",
}

const TYPE_GUIDANCE: Record<QuizQuestionType, string> = {
  multiple_choice: "All questions must be multiple_choice with exactly 4 options.",
  short_answer: "All questions must be short_answer (no options array).",
  mixed:
    "Mix question types freely across multiple_choice, short_answer, code_reading, and debugging.",
}

async function getRealQuiz(input: QuizInput): Promise<GeneratedQuiz> {
  const client = new Anthropic()

  const systemPrompt = `You are a quiz generator for a CS learning platform. Generate exactly ${input.questionCount} quiz questions about "${input.topicTitle}" (from the "${input.learningPathTitle}" learning path).

Difficulty guidance: ${DIFFICULTY_GUIDANCE[input.difficulty]}
Question type guidance: ${TYPE_GUIDANCE[input.questionType]}

Rules:
- Return ONLY valid JSON — no markdown fences, no preamble, no explanation outside the JSON
- The JSON must match this exact shape:
{
  "questions": [
    {
      "questionText": "string",
      "questionType": "multiple_choice" | "short_answer" | "code_reading" | "debugging",
      "options": ["string", "string", "string", "string"],  // only for multiple_choice, code_reading, debugging
      "correctAnswer": "string",
      "explanation": "string",
      "orderIndex": number
    }
  ]
}
- options must contain exactly 4 items for multiple_choice, code_reading, and debugging questions
- short_answer questions must NOT include an options field
- correctAnswer for multiple_choice must exactly match one of the options strings
- orderIndex starts at 1 and increments by 1
- explanations must be clear and helpful for a learner who got the question wrong`

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Generate ${input.questionCount} ${input.difficulty} quiz questions about ${input.topicTitle}.`,
      },
    ],
  })

  const text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "{}"

  const parsed = JSON.parse(text) as GeneratedQuiz
  if (!Array.isArray(parsed.questions)) {
    throw new Error("AI returned invalid quiz structure")
  }
  return parsed
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function generateQuiz(input: QuizInput): Promise<GeneratedQuiz> {
  if (isMockMode) {
    return getMockQuiz(input)
  }
  return getRealQuiz(input)
}
