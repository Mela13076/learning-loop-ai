export const isMockMode = (process.env.AI_MODE ?? 'mock') === 'mock'
export const AI_MODEL = process.env.AI_MODEL ?? 'gemini-2.5-flash-lite'

function positiveIntegerEnv(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10)
  return Number.isSafeInteger(value) && value > 0 ? value : fallback
}

export const AI_USAGE_LIMITS = {
  // A 15-question short-answer/code-reading quiz may dispatch 15 grading calls.
  perMinute: positiveIntegerEnv("AI_USAGE_LIMIT_PER_MINUTE", 20),
  perDay: positiveIntegerEnv("AI_USAGE_LIMIT_PER_DAY", 40),
} as const
