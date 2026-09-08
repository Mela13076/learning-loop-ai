import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as zod from "zod";

function load(file, dependencies = {}) {
  const exports = {};
  const source = fs.readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    Response,
    require(id) {
      assert(id in dependencies, `Unexpected dependency: ${id}`);
      return dependencies[id];
    },
  });
  return exports;
}

const params = (id) => ({ params: Promise.resolve({ id }) });

test("quiz fetch requires its owner and never selects answer keys", async () => {
  const controls = { clerkId: "clerk", dbUser: { id: "user-a" }, quiz: null, query: null };
  const route = load("../src/app/api/quizzes/[id]/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: controls.clerkId }) },
    "@/lib/db": { db: {
      user: { findUnique: async () => controls.dbUser },
      quiz: { findUnique: async (query) => { controls.query = query; return controls.quiz; } },
    } },
  });

  assert.equal((await route.GET(new Request("http://localhost"), params("quiz"))).status, 404);
  controls.quiz = { id: "quiz", userId: "user-b" };
  assert.equal((await route.GET(new Request("http://localhost"), params("quiz"))).status, 403);

  controls.quiz = { id: "quiz", userId: "user-a", questions: [], topic: { id: "topic", title: "Topic" } };
  const response = await route.GET(new Request("http://localhost"), params("quiz"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), controls.quiz);
  assert.deepEqual(JSON.parse(JSON.stringify(controls.query.include.questions.select)), {
    id: true, questionText: true, questionType: true, options: true, orderIndex: true,
  });
  assert.equal("correctAnswer" in controls.query.include.questions.select, false);

  controls.clerkId = null;
  assert.equal((await route.GET(new Request("http://localhost"), params("quiz"))).status, 401);
});

test("quiz-attempt fetch enforces ownership before returning answers", async () => {
  const controls = { attempt: null };
  const route = load("../src/app/api/quiz-attempts/[id]/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: "clerk" }) },
    "@/lib/db": { db: {
      user: { findUnique: async () => ({ id: "user-a" }) },
      quizAttempt: { findUnique: async () => controls.attempt },
    } },
  });

  assert.equal((await route.GET(new Request("http://localhost"), params("attempt"))).status, 404);
  controls.attempt = { id: "attempt", userId: "user-b" };
  assert.equal((await route.GET(new Request("http://localhost"), params("attempt"))).status, 403);
  controls.attempt = { id: "attempt", userId: "user-a", answers: [{ id: "answer" }] };
  const response = await route.GET(new Request("http://localhost"), params("attempt"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), controls.attempt);
});

test("study-session read, edit, and deletion are restricted to the session owner", async () => {
  const controls = {
    clerkId: "clerk",
    session: { id: "session", userId: "user-a", topicId: null, notes: "Original" },
    update: null,
    deleted: null,
  };
  const route = load("../src/app/api/study-sessions/[id]/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: controls.clerkId }) },
    zod,
    "@/lib/db": { db: {
      user: { findUnique: async () => ({ id: "user-a" }) },
      studySession: {
        findUnique: async () => controls.session,
        update: async (query) => { controls.update = query; return { id: "session", notes: query.data.notes }; },
        delete: async (query) => { controls.deleted = query; },
      },
    } },
    "@/lib/topic-content": { parseKeyConcepts: () => [] },
    "@/lib/topic-progress": { computeTopicMastery: () => ({}), sanitizeCoveredConceptTitles: () => [] },
  });

  const get = await route.GET(new Request("http://localhost"), params("session"));
  assert.equal(get.status, 200);
  assert.deepEqual(await get.json(), { session: controls.session });

  controls.session = { ...controls.session, userId: "user-b" };
  assert.equal((await route.PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ notes: "new" }) }), params("session"))).status, 403);
  assert.equal((await route.DELETE(new Request("http://localhost", { method: "DELETE" }), params("session"))).status, 403);
  assert.equal(controls.update, null);
  assert.equal(controls.deleted, null);

  controls.session = { ...controls.session, userId: "user-a" };
  const patch = await route.PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ notes: "  Revised notes  " }) }), params("session"));
  assert.equal(patch.status, 200);
  assert.equal(controls.update.data.notes, "Revised notes");
  assert.equal((await route.PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ notes: 42 }) }), params("session"))).status, 422);
  assert.equal((await route.DELETE(new Request("http://localhost", { method: "DELETE" }), params("session"))).status, 204);
  assert.deepEqual(JSON.parse(JSON.stringify(controls.deleted)), { where: { id: "session" } });
});
