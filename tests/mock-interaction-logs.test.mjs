import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"
import ts from "typescript"
import * as zod from "zod"

function load(file, dependencies = {}) {
  const exports = {}
  const source = fs.readFileSync(new URL(file, import.meta.url), "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  vm.runInNewContext(compiled, { exports, Response, require(id) {
    assert(id in dependencies, `Unexpected dependency: ${id}`)
    return dependencies[id]
  } })
  return exports
}

const generatedQuiz = {
  questions: [{ questionText: "Question", questionType: "multiple_choice", options: ["A", "B", "C", "D"], correctAnswer: "A", explanation: "Why", orderIndex: 1 }],
}

function quizGenerationHandler(mock, logs) {
  return load("../src/app/api/quizzes/generate/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: "clerk" }) }, zod,
    "@/lib/db": { db: {
      user: { findUnique: async () => ({ id: "user" }) },
      topic: { findUnique: async () => ({ id: "topic", title: "Topic", learningPath: { title: "Path" } }) },
      quiz: { create: async () => ({ id: "quiz" }) },
      aiInteraction: { create: async ({ data }) => logs.push(data) },
    } },
    "@/lib/ai/quiz": { generateQuiz: async () => generatedQuiz },
    "@/lib/ai/quiz-schema": { InvalidQuizResponseError: class extends Error {} },
    "@/lib/ai/config": { AI_MODEL: "gemini-test", isMockMode: mock },
    "@/lib/ai/usage-limits": { AiQuotaExceededError: class extends Error {}, aiQuotaExceededResponse: () => new Response(), reserveAiUsage: async () => {} },
    "@/lib/ai/usage-metadata": { aiUsageLogData: () => ({}) },
  })
}

function summaryHandler(mock, logs) {
  return load("../src/app/api/ai/session-summary/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: "clerk" }) }, zod,
    "@/lib/db": { db: {
      user: { findUnique: async () => ({ id: "user" }) },
      topic: { findUnique: async () => ({ id: "topic", title: "Topic", learningPath: { title: "Path" } }) },
      userTopicProgress: { findUnique: async () => null },
      aiInteraction: { create: async ({ data }) => logs.push(data) },
    } },
    "@/lib/ai/summary": { generateSessionSummary: async () => ({ summary: "Summary" }) },
    "@/lib/ai/config": { AI_MODEL: "gemini-test", isMockMode: mock },
    "@/lib/ai/usage-limits": { AiQuotaExceededError: class extends Error {}, aiQuotaExceededResponse: () => new Response(), reserveAiUsage: async () => {} },
    "@/lib/ai/usage-metadata": { aiUsageLogData: () => ({}) },
  })
}

function recommendationHandler(mock, logs) {
  return load("../src/app/api/ai/recommendation/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: "clerk" }) }, zod,
    "@/lib/db": { db: {
      user: { findUnique: async () => ({ id: "user" }) },
      topic: { findUnique: async () => ({ id: "topic", title: "Topic", learningPathId: "path", orderIndex: 1, learningPath: { title: "Path" } }) },
      userTopicProgress: { findUnique: async () => null },
      topic: { findUnique: async () => ({ id: "topic", title: "Topic", learningPathId: "path", orderIndex: 1, learningPath: { title: "Path" } }), findFirst: async () => null },
      aiInteraction: { create: async ({ data }) => logs.push(data) },
    } },
    "@/lib/ai/recommendation": { getRecommendation: () => ({ action: "continue", reason: "Continue", recommendedTopicId: "" }) },
    "@/lib/ai/config": { isMockMode: mock },
  })
}

function coachHandler(mock, interactions) {
  let index = 0
  return load("../src/app/api/ai/coach/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: "clerk" }) }, zod,
    "@/lib/topic-content": { parseKeyConcepts: () => [{ title: "Concept" }] },
    "@/lib/ai/config": { AI_MODEL: "gemini-test", isMockMode: mock },
    "@/lib/ai/usage-limits": { AiQuotaExceededError: class extends Error {}, aiQuotaExceededResponse: () => new Response(), reserveAiUsage: async () => {} },
    "@/lib/ai/usage-metadata": { aiUsageLogData: () => ({}) },
    "@/lib/ai/coach": {
      createLearningCoachResponse: async ({ action }) => action === "quiz"
        ? { response: { type: "quiz", question: "Question" }, storedQuiz: { question: "Question", options: ["A"], correctAnswer: "A" } }
        : { response: { type: "lesson", content: "Lesson" } },
      createHintResponse: () => ({ content: "Hint" }),
      evaluateQuizAnswer: () => ({ content: "Result" }),
    },
    "@/lib/db": { db: {
      user: { findUnique: async () => ({ id: "user" }) },
      topic: { findUnique: async () => ({ id: "topic", title: "Topic", learningPath: { title: "Path" }, keyConcepts: [] }) },
      aiInteraction: {
        create: async ({ data, select }) => { const item = { id: `interaction-${++index}`, ...data }; interactions.push(item); return select ? { id: item.id } : item },
        findFirst: async ({ where }) => interactions.find(item => item.id === where.id) ?? null,
      },
    } },
  })
}

const generationBody = { topicId: "topic", difficulty: "beginner", questionCount: 5, questionType: "multiple_choice" }
const summaryBody = { topicId: "topic", durationMinutes: 5, notes: "Notes" }
const recommendationBody = { topicId: "topic" }

test("mock quiz generation, summaries, and recommendations skip audit logs", async () => {
  for (const [factory, body] of [[quizGenerationHandler, generationBody], [summaryHandler, summaryBody], [recommendationHandler, recommendationBody]]) {
    const logs = []
    const route = factory(true, logs)
    assert.equal((await route.POST(new Request("http://localhost", { method: "POST", body: JSON.stringify(body) }))).status, 200)
    assert.deepEqual(logs, [])
  }
})

test("real quiz generation, summaries, and recommendations retain audit logs", async () => {
  for (const [factory, body, type] of [[quizGenerationHandler, generationBody, "QUIZ_GENERATION"], [summaryHandler, summaryBody, "STUDY_SUMMARY"], [recommendationHandler, recommendationBody, "RECOMMENDATION"]]) {
    const logs = []
    const route = factory(false, logs)
    assert.equal((await route.POST(new Request("http://localhost", { method: "POST", body: JSON.stringify(body) }))).status, 200)
    assert.equal(logs.length, 1)
    assert.equal(logs[0].interactionType, type)
  }
})

test("mock coach preserves only persisted quiz state", async () => {
  const interactions = []
  const route = coachHandler(true, interactions)
  const start = { action: "start", topicId: "topic", conceptTitle: "Concept" }
  assert.equal((await route.POST(new Request("http://localhost", { method: "POST", body: JSON.stringify(start) }))).status, 200)
  assert.equal(interactions.length, 0)
  const quizResponse = await route.POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ ...start, action: "quiz" }) }))
  const quiz = await quizResponse.json()
  assert.equal(interactions.length, 1)
  assert.equal(interactions[0].modelUsed, "mock")
  assert.equal((await route.POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ ...start, action: "hint", interactionId: quiz.interactionId }) }))).status, 200)
  assert.equal((await route.POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ ...start, action: "answer", interactionId: quiz.interactionId, selectedAnswer: "A" }) }))).status, 200)
  assert.equal(interactions.length, 1)
})

test("real coach retains lesson, quiz-state, and hint audit records", async () => {
  const interactions = []
  const route = coachHandler(false, interactions)
  const base = { topicId: "topic", conceptTitle: "Concept" }
  await route.POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ ...base, action: "start" }) }))
  const quiz = await (await route.POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ ...base, action: "quiz" }) }))).json()
  await route.POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ ...base, action: "hint", interactionId: quiz.interactionId }) }))
  assert.equal(interactions.length, 3)
  assert(interactions.every(item => item.modelUsed === "gemini-test"))
})
