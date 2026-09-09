import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import * as zod from 'zod';
import vm from 'node:vm';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
function load(file, dependencies = {}) {
  const exports = {};
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports, Response, require(id) {
      assert(id in dependencies, `Unexpected dependency: ${id}`);
      return dependencies[id];
    },
  }, { filename: file });
  return exports;
}

const input = {
  sessionId: '00000000-0000-4000-8000-000000000001',
  durationMinutes: 25, timerMode: 'POMODORO', topicId: 'topic', notes: 'Notes',
  startedAt: '2026-09-07T12:00:00.000Z', endedAt: '2026-09-07T12:25:00.000Z',
};

// In-memory transactions model rollback and optimistic serialization conflicts.
// These tests exercise handler behavior, not PostgreSQL's isolation implementation.
function harness() {
  let state = { sessions: new Map(), progress: null };
  let version = 0;
  const controls = { userId: 'user', failProgress: false, conflict: null, transactions: 0 };
  const db = {
    user: { findUnique: async () => ({ id: controls.userId }) },
    async $transaction(callback, options) {
      assert.equal(options.isolationLevel, 'Serializable');
      controls.transactions++;
      if (controls.conflict) throw { code: controls.conflict };
      const initialVersion = version;
      const draft = structuredClone(state);
      let written = false;
      const result = await callback({
        topic: { findUnique: async ({ where }) => where.id === 'topic'
          ? { id: 'topic', estimatedMinutes: 40, keyConcepts: [] } : null },
        studySession: {
          findUnique: async ({ where }) => draft.sessions.get(where.id) ?? null,
          create: async ({ data }) => {
            if (draft.sessions.has(data.id)) throw { code: 'P2002' };
            const session = { ...data, topic: data.topicId ? { id: 'topic', title: 'Topic' } : null };
            draft.sessions.set(data.id, session);
            written = true;
            return session;
          },
        },
        userTopicProgress: {
          findUnique: async () => draft.progress,
          upsert: async ({ create, update }) => {
            if (controls.failProgress) throw new Error('Progress failed');
            draft.progress = draft.progress ? { ...draft.progress, ...update } : create;
            written = true;
            return draft.progress;
          },
        },
      });
      if (written) {
        if (version !== initialVersion) throw { code: 'P2034' };
        state = draft;
        version++;
      }
      return result;
    },
  };
  const route = load('src/app/api/study-sessions/route.ts', {
    '@clerk/nextjs/server': { auth: async () => ({ userId: controls.userId }) },
    zod, '@/lib/db': { db },
    '@/lib/topic-content': load('src/lib/topic-content.ts'),
    '@/lib/topic-progress': load('src/lib/topic-progress.ts'),
  });
  return {
    controls, state: () => state,
    save: (body = input) => route.POST(new Request('http://localhost/api/study-sessions', {
      method: 'POST', body: JSON.stringify(body),
    })),
  };
}

test('retry returns the original session without adding minutes', async () => {
  const h = harness();
  const first = await h.save();
  const second = await h.save();
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.deepEqual(await first.json(), await second.json());
  assert.equal(h.state().sessions.size, 1);
  assert.equal(h.state().progress.totalStudyMinutes, 25);
});

test('simultaneous duplicate saves commit once', async () => {
  const h = harness();
  const results = await Promise.all([h.save(), h.save()]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 201]);
  assert.equal(h.state().sessions.size, 1);
  assert.equal(h.state().progress.totalStudyMinutes, 25);
});

test('concurrent distinct sessions preserve both minute increments', async () => {
  const h = harness();
  const results = await Promise.all([h.save(), h.save({ ...input,
    sessionId: '00000000-0000-4000-8000-000000000002' })]);
  assert(results.every(r => r.status === 201));
  assert.equal(h.state().sessions.size, 2);
  assert.equal(h.state().progress.totalStudyMinutes, 50);
});

test('progress failure rolls back session; retry can save normally', async () => {
  const h = harness();
  h.controls.failProgress = true;
  await assert.rejects(h.save(), /Progress failed/);
  assert.equal(h.state().sessions.size, 0);
  assert.equal(h.state().progress, null);
  h.controls.failProgress = false;
  assert.equal((await h.save()).status, 201);
  assert.equal(h.state().progress.totalStudyMinutes, 25);
});

test('changed payload or different owner cannot reuse an ID', async () => {
  const h = harness();
  await h.save();
  for (const change of [{ durationMinutes: 50 }, { notes: 'Changed' }, { topicId: undefined }]) {
    assert.equal((await h.save({ ...input, ...change })).status, 409);
  }
  h.controls.userId = 'another-user';
  const response = await h.save();
  assert.equal(response.status, 409);
  assert.equal('session' in await response.json(), false);
  assert.equal(h.state().progress.totalStudyMinutes, 25);
});

test('unlinked sessions are also deduplicated', async () => {
  const h = harness();
  assert.equal((await h.save({ ...input, topicId: undefined })).status, 201);
  assert.equal((await h.save({ ...input, topicId: undefined })).status, 200);
  assert.equal(h.state().sessions.size, 1);
  assert.equal(h.state().progress, null);
});

test('invalid ID, missing topic, and signed-out requests do not write', async () => {
  const h = harness();
  for (const sessionId of [undefined, 'bad']) {
    assert.equal((await h.save({ ...input, sessionId })).status, 400);
  }
  assert.equal((await h.save({ ...input, topicId: 'missing' })).status, 404);
  h.controls.userId = null;
  assert.equal((await h.save()).status, 401);
  assert.equal(h.state().sessions.size, 0);
});

test('database conflicts retry at most three times and return retryable failure', async () => {
  for (const code of ['P2034', 'P2002']) {
    const h = harness();
    h.controls.conflict = code;
    const result = await h.save();
    assert.equal(result.status, 503);
    assert.equal(result.headers.get('Retry-After'), '1');
    assert.equal(h.controls.transactions, 3);
    assert.equal(h.state().sessions.size, 0);
  }
});

function timerHarness(fetch) {
  const file = path.join(root, 'src/components/timer/StudyTimer.tsx');
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const callbacks = {};
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ['handleStart', 'handleSave'].includes(node.name.getText(source))) {
      callbacks[node.name.getText(source)] = node.initializer.arguments[0].getText(source);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  const ctx = {
    fetch, crypto: webcrypto,
    sessionIdRef: { current: null }, savePayloadRef: { current: null },
    savedRef: { current: false }, saveInFlightRef: { current: false },
    startedAtRef: { current: null }, endedAtRef: { current: null },
    phaseRef: { current: 'focus' }, secondsLeftRef: { current: 1500 },
    focusSeconds: 1500, elapsedSeconds: 1500, mode: 'POMODORO',
    selectedTopicId: 'topic', notes: '',
  };
  for (const name of ['setSessionState', 'setPhase', 'setSecondsLeft', 'setElapsedSeconds',
    'setPomodoroCount', 'setSaveState', 'setSaveError', 'setSummaryState', 'setSummaryData']) ctx[name] = () => {};
  vm.createContext(ctx);
  const functions = Object.fromEntries(Object.entries(callbacks).map(([name, code]) => [name,
    vm.runInContext(ts.transpileModule(`(${code})`, {
      compilerOptions: { target: ts.ScriptTarget.ES2020 },
    }).outputText, ctx)]));
  functions.handleStart();
  ctx.endedAtRef.current = new Date();
  return { ctx, ...functions };
}

test('timer suppresses overlapping clicks and repeats after successful save', async () => {
  let release;
  let count = 0;
  const h = timerHarness(() => { count++; return new Promise(resolve => { release = resolve; }); });
  const first = h.handleSave();
  await h.handleSave();
  assert.equal(count, 1);
  release({ ok: true });
  await first;
  await h.handleSave();
  assert.equal(count, 1);
});

test('timer retries exact original payload and starts next session with a new ID', async () => {
  const bodies = [];
  const h = timerHarness(async (_url, request) => {
    bodies.push(request.body);
    if (bodies.length === 1) throw new Error('Response lost');
    return { ok: true };
  });
  await h.handleSave();
  assert.equal(h.ctx.saveInFlightRef.current, false);
  h.ctx.elapsedSeconds = 3000;
  await h.handleSave();
  assert.equal(bodies[0], bodies[1]);
  const oldId = JSON.parse(bodies[0]).sessionId;
  h.handleStart();
  h.ctx.endedAtRef.current = new Date();
  await h.handleSave();
  assert.notEqual(JSON.parse(bodies[2]).sessionId, oldId);
});
