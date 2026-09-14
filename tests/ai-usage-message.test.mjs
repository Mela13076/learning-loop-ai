import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"
import ts from "typescript"

const exports = {}
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(new URL("../src/lib/ai/usage-message.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }
  ).outputText,
  { exports, Intl }
)

test("formats minute and daily quota messages distinctly", () => {
  const resetAt = "2026-09-12T19:00:00.000Z"
  assert.match(
    exports.formatAiQuotaMessage({ limitType: "minute", resetAt }),
    /sent several AI requests quickly/
  )
  assert.match(
    exports.formatAiQuotaMessage({ limitType: "daily", resetAt }),
    /reached today’s AI limit/
  )
})

test("uses the API error as a fallback for non-quota failures", () => {
  assert.equal(exports.formatAiQuotaMessage({ error: "Topic not found" }), "Topic not found")
})
