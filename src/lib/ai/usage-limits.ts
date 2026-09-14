import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { AI_USAGE_LIMITS } from "./config"

const SERIALIZATION_RETRY_LIMIT = 3

export class AiQuotaExceededError extends Error {
  constructor(
    readonly limitType: "minute" | "daily",
    readonly resetAt: Date
  ) {
    super(
      limitType === "daily"
        ? "You've reached today's AI limit."
        : "AI requests are temporarily limited."
    )
    this.name = "AiQuotaExceededError"
  }
}

function startOfUtcMinute(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes()
  ))
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function retryAfterSeconds(resetAt: Date): number {
  return Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))
}

function isSerializationFailure(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
}

/**
 * Atomically reserves paid AI-call units in fixed UTC minute and day buckets.
 * Call this only after request validation and resource authorization, and
 * immediately before dispatching work to Gemini. Reservations are intentionally
 * retained after dispatch: Gemini may have processed a failed response already.
 */
export async function reserveAiUsage(userId: string, units: number): Promise<void> {
  if (!Number.isSafeInteger(units) || units < 1) {
    throw new Error("AI usage units must be a positive integer")
  }

  const now = new Date()
  const minuteStart = startOfUtcMinute(now)
  const dayStart = startOfUtcDay(now)

  for (let attempt = 0; attempt < SERIALIZATION_RETRY_LIMIT; attempt += 1) {
    try {
      await db.$transaction(async (tx) => {
        const minute = await tx.aiUsageBucket.upsert({
          where: {
            userId_bucketType_bucketStart: {
              userId,
              bucketType: "MINUTE",
              bucketStart: minuteStart,
            },
          },
          create: { userId, bucketType: "MINUTE", bucketStart: minuteStart, unitsUsed: units },
          update: { unitsUsed: { increment: units } },
        })

        if (minute.unitsUsed > AI_USAGE_LIMITS.perMinute) {
          throw new AiQuotaExceededError(
            "minute",
            new Date(minuteStart.getTime() + 60 * 1000)
          )
        }

        const day = await tx.aiUsageBucket.upsert({
          where: {
            userId_bucketType_bucketStart: {
              userId,
              bucketType: "DAY",
              bucketStart: dayStart,
            },
          },
          create: { userId, bucketType: "DAY", bucketStart: dayStart, unitsUsed: units },
          update: { unitsUsed: { increment: units } },
        })

        if (day.unitsUsed > AI_USAGE_LIMITS.perDay) {
          const nextDay = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
          throw new AiQuotaExceededError("daily", nextDay)
        }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      return
    } catch (error) {
      if (error instanceof AiQuotaExceededError) throw error
      if (isSerializationFailure(error) && attempt < SERIALIZATION_RETRY_LIMIT - 1) continue
      throw error
    }
  }
}

export function aiQuotaExceededResponse(error: AiQuotaExceededError): Response {
  const retryAfter = retryAfterSeconds(error.resetAt)
  return Response.json(
    {
      error: error.message,
      limitType: error.limitType,
      retryAfterSeconds: retryAfter,
      resetAt: error.resetAt.toISOString(),
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  )
}
