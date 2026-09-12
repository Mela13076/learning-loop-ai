import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"
import ts from "typescript"

function loadUsageLimits(db, limits = { perMinute: 10, perDay: 40 }) {
  const exports = {}
  const source = fs.readFileSync(new URL("../src/lib/ai/usage-limits.ts", import.meta.url), "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  class PrismaClientKnownRequestError extends Error {}
  vm.runInNewContext(compiled, {
    exports,
    Response,
    require(id) {
      if (id === "server-only") return {}
      if (id === "@/lib/db") return { db }
      if (id === "./config") return { AI_USAGE_LIMITS: limits }
      if (id === "@/generated/prisma/client") {
        return {
          Prisma: {
            TransactionIsolationLevel: { Serializable: "Serializable" },
            PrismaClientKnownRequestError,
          },
        }
      }
      assert.fail(`Unexpected dependency: ${id}`)
    },
  })
  return exports
}

function usageDb() {
  let rows = []
  return {
    get rows() { return rows },
    async $transaction(callback) {
      const pending = rows.map((row) => ({ ...row }))
      const tx = {
        aiUsageBucket: {
          upsert: async ({ where, create, update }) => {
            const key = where.userId_bucketType_bucketStart
            const row = pending.find((item) =>
              item.userId === key.userId &&
              item.bucketType === key.bucketType &&
              item.bucketStart.getTime() === key.bucketStart.getTime()
            )
            if (row) {
              row.unitsUsed += update.unitsUsed.increment
              return row
            }
            const created = { ...create }
            pending.push(created)
            return created
          },
        },
      }
      const result = await callback(tx)
      rows = pending
      return result
    },
  }
}

test("usage reservations increment both UTC buckets", async () => {
  const db = usageDb()
  const usage = loadUsageLimits(db)
  await usage.reserveAiUsage("user", 2)
  assert.equal(db.rows.length, 2)
  assert.deepEqual(db.rows.map((row) => row.unitsUsed).sort(), [2, 2])
})

test("a rejected reservation rolls back both buckets and returns a retryable 429", async () => {
  const db = usageDb()
  const usage = loadUsageLimits(db, { perMinute: 2, perDay: 4 })
  await usage.reserveAiUsage("user", 2)
  await assert.rejects(() => usage.reserveAiUsage("user", 1), usage.AiQuotaExceededError)
  assert.deepEqual(db.rows.map((row) => row.unitsUsed).sort(), [2, 2])

  const response = usage.aiQuotaExceededResponse(
    new usage.AiQuotaExceededError("minute", new Date(Date.now() + 60_000))
  )
  assert.equal(response.status, 429)
  assert.equal(response.headers.get("Retry-After"), "60")
})
