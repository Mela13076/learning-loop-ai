import type { AiUsageMetadata } from "./client"

/** Maps optional provider metadata to explicit audit-log columns. */
export function aiUsageLogData(usage?: AiUsageMetadata) {
  return {
    promptTokenCount: usage?.promptTokenCount,
    outputTokenCount: usage?.outputTokenCount,
    totalTokenCount: usage?.totalTokenCount,
  }
}
