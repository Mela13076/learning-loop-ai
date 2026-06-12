export const isMockMode = (process.env.AI_MODE ?? 'mock') === 'mock'
export const AI_MODEL = process.env.AI_MODEL ?? 'claude-haiku-4-5-20251001'
