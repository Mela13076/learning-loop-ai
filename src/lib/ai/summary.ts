import { isMockMode } from "./config"
import { generateJson } from "./client"

export interface SummaryInput {
  topicTitle: string
  learningPathTitle: string
  durationMinutes: number
  notes?: string
  quizScore?: number
  incorrectTopics?: string[]
  masteryScore: number
}

export interface SummaryResponse {
  summary: string
  keyTakeaways: string[]
  weakAreas: string[]
  recommendedNext: string
}

const MOCK_RESPONSE: SummaryResponse = {
  summary:
    "Great session! You spent quality time working through key concepts and strengthening your understanding. Consistent practice like this is exactly how lasting mastery is built.",
  keyTakeaways: [
    "Review the core concepts you covered today before your next session",
    "Practice applying what you learned with small hands-on exercises",
    "Connect today's material to topics you already understand well",
  ],
  weakAreas: [],
  recommendedNext:
    "Continue with the next topic in your learning path, or reinforce today's material by generating a quiz.",
}

export async function generateSessionSummary(
  input: SummaryInput
): Promise<SummaryResponse> {
  if (isMockMode) return MOCK_RESPONSE

  const userContent = `Session data:
- Topic: ${input.topicTitle}
- Learning path: ${input.learningPathTitle}
- Duration: ${input.durationMinutes} minute${input.durationMinutes !== 1 ? "s" : ""}
- Current mastery score: ${input.masteryScore}%
${input.notes ? `- Session notes: ${input.notes}` : ""}
${input.quizScore !== undefined ? `- Quiz score this session: ${input.quizScore}%` : ""}
${input.incorrectTopics?.length ? `- Concepts to review: ${input.incorrectTopics.join(", ")}` : ""}

Return a JSON object with this exact shape and nothing else:
{
  "summary": "2–3 encouraging sentences recapping the session",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "weakAreas": ["area 1"],
  "recommendedNext": "one sentence on what to study next"
}`

  const text = await generateJson({
    prompt: userContent,
    systemInstruction:
      "You generate study session summaries. Return only valid JSON with no markdown fences, preamble, or extra explanation.",
    maxOutputTokens: 512,
  })

  try {
    const parsed = JSON.parse(text) as Partial<SummaryResponse>
    return {
      summary:
        typeof parsed.summary === "string" ? parsed.summary : MOCK_RESPONSE.summary,
      keyTakeaways: Array.isArray(parsed.keyTakeaways)
        ? (parsed.keyTakeaways as string[])
        : MOCK_RESPONSE.keyTakeaways,
      weakAreas: Array.isArray(parsed.weakAreas)
        ? (parsed.weakAreas as string[])
        : [],
      recommendedNext:
        typeof parsed.recommendedNext === "string"
          ? parsed.recommendedNext
          : MOCK_RESPONSE.recommendedNext,
    }
  } catch {
    return MOCK_RESPONSE
  }
}
