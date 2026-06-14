export const isMockMode = (process.env.AI_MODE ?? 'mock') === 'mock'
export const AI_MODEL = process.env.AI_MODEL ?? 'gemini-2.5-flash-lite'
