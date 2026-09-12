export interface AiQuotaErrorResponse {
  error?: string
  limitType?: "minute" | "daily"
  retryAfterSeconds?: number
  resetAt?: string
}

/** Formats quota reset times in the learner's browser time zone. */
export function formatAiQuotaMessage(error: AiQuotaErrorResponse): string {
  if (!error.limitType || !error.resetAt) {
    return error.error ?? "AI request limit reached. Please try again later."
  }

  const resetAt = new Date(error.resetAt)
  if (Number.isNaN(resetAt.getTime())) {
    return error.error ?? "AI request limit reached. Please try again later."
  }

  const resetTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(resetAt)

  return error.limitType === "daily"
    ? `You’ve reached today’s AI limit. Your allowance resets at ${resetTime}.`
    : `You’ve sent several AI requests quickly. Try again at ${resetTime}.`
}
