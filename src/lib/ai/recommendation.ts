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

function getRecommendationAction(
  input: RecommendationInput
): RecommendationResponse["action"] {
  if (input.isMastered) {
    return "next_topic"
  }

  if (input.masteryScore < 60) {
    return "continue"
  }

  return "review"
}

function getRecommendationReason(
  input: RecommendationInput,
  action: RecommendationResponse["action"]
): string {
  if (action === "next_topic") {
    return `Your mastery of ${input.currentTopicTitle} is strong, so you're ready for the next topic.`
  }

  if (action === "review") {
    return `You have a solid foundation in ${input.currentTopicTitle}, but a quick review will help before moving on.`
  }

  return `Keep practicing ${input.currentTopicTitle} until your mastery is above 60% before advancing.`
}

export function getRecommendation(
  input: RecommendationInput
): RecommendationResponse {
  const action = getRecommendationAction(input)

  return {
    recommendedTopicId: "",
    reason: getRecommendationReason(input, action),
    action,
  }
}
