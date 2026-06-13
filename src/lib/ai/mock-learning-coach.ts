import type {
  LearningCoachContext,
  StoredCoachQuiz,
} from "./coach-types"

interface MockConceptFlow {
  intro: string
  explanation: string
  example: string
  quizzes: StoredCoachQuiz[]
}

function normalizeConceptKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-")
}

const MOCK_LESSONS: Record<string, MockConceptFlow> = {
  selectors: {
    intro:
      "CSS selectors tell the browser which HTML elements should receive a style rule. They are the connection point between the structure in your HTML and the styling in your CSS.",
    explanation:
      "A selector matches one or more elements. For example, an element selector targets tags like `p`, a class selector targets reusable groups like `.card`, and an ID selector targets a single element like `#header`. If you can identify the HTML you want to style, you can choose the selector that matches it.",
    example:
      "Here is a simple selector in action:\n\n```html\n<p class=\"note\">Hello World</p>\n```\n\n```css\n.note {\n  color: red;\n}\n```\n\nThe CSS rule targets the paragraph because the class name in HTML matches the `.note` selector in CSS.",
    quizzes: [
      {
        title: "CSS Selectors Check",
        question: "Which selector targets an element with `class=\"card\"`?",
        options: ["#card", ".card", "card", "<card>"],
        correctAnswer: ".card",
        hint: "Classes and IDs use special symbols. Think about which symbol is used before a class name.",
        explanation:
          "The `.` symbol targets classes in CSS. `#card` would target an ID, while `card` would target an HTML element named `card`.",
        correctFeedback:
          "Correct. `.card` targets every element whose class attribute includes `card`.",
        incorrectFeedback:
          "Not quite. A class selector uses a symbol before the class name, and it is different from the symbol used for IDs.",
      },
      {
        title: "CSS Selectors Check",
        question: "What does the selector `p` target?",
        options: [
          "Any paragraph element",
          "Only elements with class `p`",
          "Only one paragraph with id `p`",
          "Any parent element",
        ],
        correctAnswer: "Any paragraph element",
        hint: "A selector without `.` or `#` is targeting an HTML tag directly.",
        explanation:
          "The selector `p` is an element selector, so it matches all `<p>` elements on the page.",
        correctFeedback:
          "Correct. Plain tag selectors target every matching HTML element of that type.",
        incorrectFeedback:
          "Close, but `p` does not refer to a class or ID here. It is the tag name itself.",
      },
    ],
  },
  "javascript-variables": {
    intro:
      "Variables give a name to a value so your program can reuse it, update it, or pass it into other logic. They help you store state instead of hard-coding the same value everywhere.",
    explanation:
      "In JavaScript, a variable declaration creates a binding between a name and a value. `const` is used when the binding should not be reassigned, while `let` is used when the value may change later. Good variable names make code easier to understand because they explain what the value represents.",
    example:
      "A basic variable example looks like this:\n\n```js\nconst courseName = \"Frontend Fundamentals\"\nlet completedLessons = 3\n\ncompletedLessons = completedLessons + 1\n```\n\n`courseName` stays the same, while `completedLessons` is updated as progress changes.",
    quizzes: [
      {
        title: "JavaScript Variables Check",
        question:
          "Which declaration is the best choice when a value should not be reassigned after it is created?",
        options: ["var", "let", "const", "static"],
        correctAnswer: "const",
        hint: "Think about which keyword signals that the binding should stay fixed.",
        explanation:
          "`const` prevents reassignment of the variable binding, which makes intent clearer when the value should stay the same.",
        correctFeedback:
          "Correct. `const` is the clearest choice when the binding should not be reassigned.",
        incorrectFeedback:
          "Not quite. The best answer is the keyword that communicates a fixed binding after initialization.",
      },
      {
        title: "JavaScript Variables Check",
        question:
          "Why is `let` usually preferred over `var` in modern JavaScript?",
        options: [
          "`let` creates block-scoped variables",
          "`let` makes values immutable",
          "`let` can only store numbers",
          "`let` automatically converts strings to numbers",
        ],
        correctAnswer: "`let` creates block-scoped variables",
        hint: "The difference is mostly about scope, not data type or immutability.",
        explanation:
          "`let` is block-scoped, which makes behavior more predictable inside loops, conditionals, and nested blocks.",
        correctFeedback:
          "Correct. Block scope is one of the main reasons `let` replaced many `var` use cases.",
        incorrectFeedback:
          "That is not the main advantage. Focus on how long the variable stays visible in the code.",
      },
    ],
  },
  "python-data-types": {
    intro:
      "A data type describes what kind of value you are working with, such as text, numbers, or collections. Knowing the type helps you predict what operations are valid.",
    explanation:
      "Python includes common built-in types like `int` for whole numbers, `float` for decimal numbers, `str` for text, `bool` for true or false values, and collection types like `list` and `dict`. The type matters because it affects what methods you can call and how values behave in expressions.",
    example:
      "Here is a small set of Python values with different types:\n\n```python\nage = 21          # int\nprice = 19.99     # float\nname = \"Ava\"     # str\nis_ready = True   # bool\n```\n\nEach variable stores a different kind of value, so Python treats them differently during computation.",
    quizzes: [
      {
        title: "Python Data Types Check",
        question: "Which Python type is used to store text such as `\"hello\"`?",
        options: ["int", "bool", "str", "list"],
        correctAnswer: "str",
        hint: "Think about the built-in type whose name is short for `string`.",
        explanation:
          "`str` stands for string, which is Python's built-in type for text values.",
        correctFeedback:
          "Correct. Text values like `\"hello\"` are stored as `str` objects.",
        incorrectFeedback:
          "Not quite. The correct type name is the one Python uses for string data.",
      },
      {
        title: "Python Data Types Check",
        question:
          "What is the main difference between a `list` and a `dict` in Python?",
        options: [
          "A list stores items by position, while a dict stores values by key",
          "A list can only store numbers, while a dict can only store strings",
          "A dict is ordered, while a list is not",
          "A dict cannot contain multiple values",
        ],
        correctAnswer:
          "A list stores items by position, while a dict stores values by key",
        hint: "One structure is indexed numerically, and the other uses named lookups.",
        explanation:
          "Lists are ordered sequences accessed by index, while dictionaries map keys to values for label-based lookup.",
        correctFeedback:
          "Correct. The key distinction is positional access versus key-based access.",
        incorrectFeedback:
          "Close, but focus on how each structure looks up stored values.",
      },
    ],
  },
}

function createGenericQuiz(context: LearningCoachContext): StoredCoachQuiz {
  return {
    title: `${context.conceptTitle} Check`,
    question: `Which statement best describes ${context.conceptTitle}?`,
    options: [
      `${context.conceptTitle} is a core idea inside ${context.topicTitle}.`,
      `${context.conceptTitle} is only the name of the learning path.`,
      `${context.conceptTitle} is unrelated to ${context.topicTitle}.`,
      `${context.conceptTitle} cannot be explained with examples or practice.`,
    ],
    correctAnswer: `${context.conceptTitle} is a core idea inside ${context.topicTitle}.`,
    hint:
      "Look for the option that matches the role of a key concept inside a topic, not a label outside the lesson.",
    explanation:
      `${context.conceptTitle} is one of the main ideas a learner should understand while studying ${context.topicTitle}.`,
    correctFeedback:
      `Correct. ${context.conceptTitle} is being treated as a core concept within this topic.`,
    incorrectFeedback:
      "Not quite. The best answer describes the concept as part of the actual learning material.",
  }
}

function createGenericFlow(context: LearningCoachContext): MockConceptFlow {
  const description = context.conceptDescription?.trim()

  return {
    intro:
      description
        ? `${context.conceptTitle} is one of the key ideas inside ${context.topicTitle}. ${description}`
        : `${context.conceptTitle} is one of the key ideas inside ${context.topicTitle}. Understanding it will make the rest of the topic easier to reason about.`,
    explanation:
      description
        ? `${description} As you study it, focus on what the concept does, when it is used, and how it connects to the rest of ${context.topicTitle}.`
        : `Focus on what ${context.conceptTitle} means, when you would use it, and how it connects to the rest of ${context.topicTitle}.`,
    example:
      `Try grounding ${context.conceptTitle} in a simple example. Ask yourself: what would a beginner actually see, write, or change when using this concept in ${context.topicTitle}? That concrete example is usually what turns a definition into understanding.`,
    quizzes: [createGenericQuiz(context)],
  }
}

export function getMockConceptFlow(
  context: LearningCoachContext
): MockConceptFlow {
  const exact = MOCK_LESSONS[normalizeConceptKey(context.conceptTitle)]
  if (exact) return exact

  const words = normalizeConceptKey(context.conceptTitle).split("-")
  const partial = Object.entries(MOCK_LESSONS).find(([key]) =>
    words.every((word) => key.includes(word))
  )

  if (partial) {
    return partial[1]
  }

  return createGenericFlow(context)
}

export function getMockQuizForIndex(
  context: LearningCoachContext,
  quizIndex: number
): StoredCoachQuiz {
  const flow = getMockConceptFlow(context)
  return flow.quizzes[quizIndex % flow.quizzes.length]
}
