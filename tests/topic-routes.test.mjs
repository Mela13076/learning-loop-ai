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

test("topic and progress reads require a signed-in database user and scope progress by user", async () => {
  const controls = { clerkId: "clerk", dbUser: { id: "user-a" }, topic: { id: "topic" }, progress: null, progressQuery: null };
  const topicRoute = load("../src/app/api/topics/[id]/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: controls.clerkId }) },
    "@/lib/db": { db: { topic: { findUnique: async () => controls.topic } } },
  });
  const progressRoute = load("../src/app/api/topics/[id]/progress/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: controls.clerkId }) },
    "@/lib/db": { db: {
      user: { findUnique: async () => controls.dbUser },
      userTopicProgress: { findUnique: async (query) => { controls.progressQuery = query; return controls.progress; } },
    } },
  });

  assert.equal((await topicRoute.GET(new Request("http://localhost"), params("missing"))).status, 200);
  const defaultProgress = await progressRoute.GET(new Request("http://localhost"), params("topic"));
  assert.equal(defaultProgress.status, 200);
  assert.deepEqual((await defaultProgress.json()).progress, {
    topicId: "topic", status: "NOT_STARTED", masteryScore: 0, totalStudyMinutes: 0,
    quizzesCompleted: 0, averageQuizScore: 0, coveredConceptTitles: [],
    finalQuizPassed: false, finalQuizPassedAt: null, lastStudiedAt: null,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(controls.progressQuery.where.userId_topicId)), { userId: "user-a", topicId: "topic" });

  controls.progress = { topicId: "topic", status: "IN_PROGRESS" };
  assert.deepEqual((await (await progressRoute.GET(new Request("http://localhost"), params("topic"))).json()).progress, controls.progress);
  controls.clerkId = null;
  assert.equal((await topicRoute.GET(new Request("http://localhost"), params("topic"))).status, 401);
  assert.equal((await progressRoute.GET(new Request("http://localhost"), params("topic"))).status, 401);
});

test("concept completion rejects unknown concepts and only writes the current user's progress", async () => {
  const controls = { clerkId: "clerk", upsert: null };
  const route = load("../src/app/api/topics/[id]/concepts/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: controls.clerkId }) },
    zod,
    "@/lib/db": { db: {
      user: { findUnique: async () => ({ id: "user-a" }) },
      topic: { findUnique: async () => ({ id: "topic", estimatedMinutes: 30, keyConcepts: [
        { title: "Variables" }, { title: "Functions" },
      ] }) },
      userTopicProgress: {
        findUnique: async () => ({ coveredConceptTitles: ["Variables", "Removed concept"], averageQuizScore: 0, finalQuizPassed: false, quizzesCompleted: 0, totalStudyMinutes: 0 }),
        upsert: async (query) => {
          controls.upsert = query;
          return { coveredConceptTitles: query.update.coveredConceptTitles, finalQuizPassed: false, masteryScore: query.update.masteryScore, status: query.update.status };
        },
      },
    } },
    "@/lib/topic-content": { parseKeyConcepts: (value) => value },
    "@/lib/topic-progress": {
      sanitizeCoveredConceptTitles: ({ coveredConceptTitles, validConceptTitles }) => coveredConceptTitles.filter((title) => validConceptTitles.includes(title)),
      computeTopicMastery: () => ({ masteryScore: 10, status: "IN_PROGRESS" }),
    },
  });

  const unknown = await route.PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ title: "Unknown", completed: true }) }), params("topic"));
  assert.equal(unknown.status, 404);
  assert.equal(controls.upsert, null);
  assert.equal((await route.PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ title: "", completed: true }) }), params("topic"))).status, 422);

  const response = await route.PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ title: "Functions", completed: true }) }), params("topic"));
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(controls.upsert.where.userId_topicId)), { userId: "user-a", topicId: "topic" });
  assert.deepEqual(JSON.parse(JSON.stringify(controls.upsert.update.coveredConceptTitles)), ["Variables", "Functions"]);
});
