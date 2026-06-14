import Anthropic from "@anthropic-ai/sdk"
import { isMockMode, AI_MODEL } from "./config"

export interface RecommendationInput {
  currentTopicTitle: string
  isMastered: boolean
  learningPathTitle: string
  masteryScore: number
  recentQuizScores: number[]
  weakTopics: string[]
}

export interface RecommendationResponse {
  recommendedTopicId: string
  reason: string
  action: "continue" | "review" | "next_topic"
}

export async function getRecommendation(
  input: RecommendationInput
): Promise<RecommendationResponse> {
  if (isMockMode) {
    const action: RecommendationResponse["action"] =
      input.isMastered
        ? "next_topic"
        : input.masteryScore >= 50
          ? "review"
          : "continue"
    return {
      recommendedTopicId: "",
      reason:
        action === "next_topic"
          ? `Your mastery of ${input.currentTopicTitle} is strong — you're ready to advance to the next topic.`
          : action === "review"
            ? `You have a solid foundation in ${input.currentTopicTitle}, but reviewing the weaker areas will help before moving on.`
            : `Keep practicing ${input.currentTopicTitle} to build stronger mastery before advancing.`,
      action,
    }
  }

  const client = new Anthropic()

  const avgScore =
    input.recentQuizScores.length > 0
      ? Math.round(
          input.recentQuizScores.reduce((a, b) => a + b, 0) /
            input.recentQuizScores.length
        )
      : null

  const userContent = `Learner context:
- Current topic: ${input.currentTopicTitle}
- Learning path: ${input.learningPathTitle}
- Mastery score: ${input.masteryScore}%
- Mastered: ${input.isMastered ? "yes" : "no"}
${avgScore !== null ? `- Average quiz score: ${avgScore}%` : ""}
${input.weakTopics.length ? `- Weak areas: ${input.weakTopics.join(", ")}` : ""}

Return a JSON object with this exact shape and nothing else:
{
  "recommendedTopicId": "",
  "reason": "one sentence explaining the recommendation",
  "action": "continue" | "review" | "next_topic"
}

Rules:
- "continue" if mastery < 60 (more practice on current topic needed)
- "review" if mastery 60–79 (strengthen weak areas before moving on)
- "next_topic" only if the topic is mastered
- if the topic is not mastered, never return "next_topic"`

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 256,
    system:
      "You recommend next learning actions. Return only valid JSON — no markdown, no preamble.",
    messages: [{ role: "user", content: userContent }],
  })

  const text =
    message.content[0]?.type === "text" ? message.content[0].text.trim() : ""

  try {
    const parsed = JSON.parse(text) as Partial<RecommendationResponse>
    const validActions = ["continue", "review", "next_topic"] as const
    return {
      recommendedTopicId:
        typeof parsed.recommendedTopicId === "string"
          ? parsed.recommendedTopicId
          : "",
      reason:
        typeof parsed.reason === "string"
          ? parsed.reason
          : "Keep studying to build mastery.",
      action: validActions.includes(parsed.action as (typeof validActions)[number])
        ? (parsed.action as RecommendationResponse["action"])
        : "continue",
    }
  } catch {
    return {
      recommendedTopicId: "",
      reason: "Keep practicing to build mastery.",
      action: "continue",
    }
  }
}
