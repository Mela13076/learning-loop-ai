import { isMockMode } from "./config"
import { generateJson } from "./client"

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
// Shared development fixtures, not a topic-specific or difficulty-graded exam.
// Every question has choices so it can also be rendered as multiple choice.
// ---------------------------------------------------------------------------

const MOCK_QUESTIONS: (GeneratedQuestion & { options: string[] })[] = [
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
      "What is a function's return value?",
    questionType: "short_answer",
    options: [
      "Data sent back to the caller",
      "The function's name",
      "The number of parameters",
      "Text that must be printed to the screen",
    ],
    correctAnswer:
      "Data sent back to the caller",
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
  {
    questionText: "Which data structure uses FIFO (First In, First Out) ordering?",
    questionType: "multiple_choice",
    options: ["Stack", "Queue", "Tree", "Set"],
    correctAnswer: "Queue",
    explanation: "A queue removes items in the order they were added.",
    orderIndex: 6,
  },
  {
    questionText: "What is the stopping condition in a recursive function called?",
    questionType: "short_answer",
    options: ["Loop counter", "Parameter", "Base case", "Return type"],
    correctAnswer: "Base case",
    explanation: "The base case ends recursion without making another recursive call.",
    orderIndex: 7,
  },
  {
    questionText: "What does this Python code print?\n\n```python\nvalues = [10, 20, 30]\nprint(values[0])\n```",
    questionType: "code_reading",
    options: ["0", "10", "20", "30"],
    correctAnswer: "10",
    explanation: "Python list indexing starts at zero, so values[0] is the first element.",
    orderIndex: 8,
  },
  {
    questionText: "Which HTML element creates a hyperlink?",
    questionType: "multiple_choice",
    options: ["<p>", "<div>", "<span>", "<a>"],
    correctAnswer: "<a>",
    explanation: "The anchor element <a> creates a hyperlink when supplied with an href.",
    orderIndex: 9,
  },
  {
    questionText: "What is wrong with this Python code?\n\n```python\nitems = [1, 2]\nprint(items[2])\n```",
    questionType: "debugging",
    options: ["The index is outside the list", "Lists cannot contain numbers", "print requires two arguments", "The list must be sorted"],
    correctAnswer: "The index is outside the list",
    explanation: "A two-element list has indices 0 and 1. Accessing index 2 raises IndexError.",
    orderIndex: 10,
  },
  {
    questionText: "Which CSS property sets the text color?",
    questionType: "short_answer",
    options: ["background-color", "font-size", "color", "display"],
    correctAnswer: "color",
    explanation: "The color property controls the foreground color of text.",
    orderIndex: 11,
  },
  {
    questionText: "What does this Python code print?\n\n```python\ntotal = 0\nfor value in [1, 2, 3]:\n    total += value\nprint(total)\n```",
    questionType: "code_reading",
    options: ["3", "5", "6", "0"],
    correctAnswer: "6",
    explanation: "The loop adds 1, then 2, then 3 to total, producing 6.",
    orderIndex: 12,
  },
  {
    questionText: "Which Python collection stores key-value pairs?",
    questionType: "multiple_choice",
    options: ["List", "Tuple", "Set", "Dictionary"],
    correctAnswer: "Dictionary",
    explanation: "A dictionary maps keys to values.",
    orderIndex: 13,
  },
  {
    questionText: "What ordering does a numeric array need for standard binary search?",
    questionType: "short_answer",
    options: ["Random order", "Sorted order", "Insertion order only", "Alternating positive and negative values"],
    correctAnswer: "Sorted order",
    explanation: "Binary search uses sorted order to discard half of the remaining search range at each step.",
    orderIndex: 14,
  },
  {
    questionText: "Why does this Python code print None?\n\n```python\ndef double(value):\n    result = value * 2\nprint(double(3))\n```",
    questionType: "debugging",
    options: ["Multiplication is unsupported", "The argument must be a string", "The function does not return its result", "Functions cannot be passed to print"],
    correctAnswer: "The function does not return its result",
    explanation: "Without an explicit return statement, a Python function returns None.",
    orderIndex: 15,
  },
]

function getMockQuiz(input: QuizInput): GeneratedQuiz {
  const questions = MOCK_QUESTIONS.slice(0, input.questionCount).map((q, i) => {
    const { options, ...question } = q
    const questionType = input.questionType === "mixed"
      ? q.questionType
      : input.questionType

    return {
      ...question,
      questionType,
      ...(questionType === "short_answer" ? {} : { options: [...options] }),
      orderIndex: i + 1,
    }
  })
  return { questions }
}

// ---------------------------------------------------------------------------
// Real Gemini implementation
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

  const text = await generateJson({
    prompt: `Generate ${input.questionCount} ${input.difficulty} quiz questions about ${input.topicTitle}.`,
    systemInstruction: systemPrompt,
    maxOutputTokens: 4096,
  })

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
