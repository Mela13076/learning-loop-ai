export type LearningCoachRequestAction =
  | "start"
  | "explain"
  | "example"
  | "quiz"
  | "hint"
  | "answer"

export type LearningCoachNextAction =
  | "explain"
  | "example"
  | "quiz"
  | "hint"
  | "try-again"
  | "change-concept"
  | "finish-session"

export interface LearningCoachLessonResponse {
  type: "lesson"
  lessonType:
    | "intro"
    | "explanation"
    | "example"
    | "hint"
    | "correct"
    | "incorrect"
  title: string
  content: string
  nextActions: LearningCoachNextAction[]
}

export interface LearningCoachQuizResponse {
  type: "quiz"
  title: string
  question: string
  options: string[]
  interactionId: string
  nextActions: LearningCoachNextAction[]
}

export type LearningCoachResponse =
  | LearningCoachLessonResponse
  | LearningCoachQuizResponse

export interface LearningCoachContext {
  topicTitle: string
  learningPathTitle: string
  conceptTitle: string
  conceptDescription?: string
}

export interface StoredCoachQuiz {
  title: string
  question: string
  options: string[]
  correctAnswer: string
  hint: string
  explanation: string
  correctFeedback: string
  incorrectFeedback: string
}

export interface LearningCoachRequest {
  action: LearningCoachRequestAction
  topicId: string
  conceptTitle: string
  conceptDescription?: string
  interactionId?: string
  quizIndex?: number
  selectedAnswer?: string
}
