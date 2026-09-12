import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as zod from 'zod';

function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, Response, require(id) {
    assert(id in dependencies, id); return dependencies[id];
  } });
  return exports;
}
const schema = load('../src/lib/ai/feedback-schema.ts', { zod });
const valid = score => ({ score, isCorrect: score === 1, isPartiallyCorrect: score === 0.5, feedback: 'Explanation' });
function service(generateJson, mock = false) {
  return load('../src/lib/ai/feedback.ts', {
    './config': { isMockMode: mock }, './client': { generateJson }, './feedback-schema': schema,
  });
}

test('accepts only the three coherent score/flag combinations', () => {
  for (const score of [0, 0.5, 1]) for (const isCorrect of [false, true]) for (const isPartiallyCorrect of [false, true]) {
    const text = JSON.stringify({ score, isCorrect, isPartiallyCorrect, feedback: 'Explanation' });
    if (isCorrect === (score === 1) && isPartiallyCorrect === (score === 0.5)) {
      assert.equal(schema.parseFeedbackResponse(text).score, score);
    } else assert.throws(() => schema.parseFeedbackResponse(text), schema.InvalidFeedbackResponseError);
  }
});

test('rejects malformed JSON, missing fields, coercible values and invalid scores', () => {
  const values = [null, [], {}, ...[-1, 0.25, 2, 100, '1', null].map(score => ({ ...valid(1), score })),
    { ...valid(1), isCorrect: 'true' }, { ...valid(1), feedback: '' },
    { ...valid(1), feedback: ' \n ' }, { ...valid(1), feedback: 42 },
    { ...valid(1), extra: 'unknown' }];
  for (const key of Object.keys(valid(1))) { const missing = valid(1); delete missing[key]; values.push(missing); }
  for (const value of values) assert.throws(() => schema.parseFeedbackResponse(JSON.stringify(value)), schema.InvalidFeedbackResponseError);
  for (const text of ['bad JSON', '', '{"score":NaN}']) assert.throws(() => schema.parseFeedbackResponse(text), schema.InvalidFeedbackResponseError);
});

test('real service rejects invalid grades and preserves valid partial credit', async () => {
  await assert.rejects(service(async () => JSON.stringify({ ...valid(1), score: 100 })).getAnswerFeedback({}), schema.InvalidFeedbackResponseError);
  assert.equal((await service(async () => JSON.stringify(valid(0.5))).getAnswerFeedback({})).score, 0.5);
});

test('mock grading remains deterministic and does not call provider', async () => {
  const feedback = service(() => { throw new Error('Unexpected AI call'); }, true);
  for (const [userAnswer, score] of [['', 0], ['wrong', 0], [' BASE  case ', 1]]) {
    assert.equal((await feedback.getAnswerFeedback({ userAnswer, correctAnswer: 'Base case', questionType: 'SHORT_ANSWER' })).score, score);
  }
});

function submissionHarness(provider, previous = false, mock = false) {
  let saved, progress;
  const writes = [];
  const logs = [];
  const questions = ['SHORT_ANSWER', 'CODE_READING'].map((questionType, i) => ({
    id: `q${i}`, questionType, questionText: `Question ${i}`, correctAnswer: 'Answer', explanation: 'Explanation',
  }));
  const db = {
    user: { findUnique: async () => ({ id: 'user' }) },
    quiz: { findUnique: async () => ({ id: 'quiz', userId: 'user', topicId: 'topic', difficulty: 'BEGINNER', questionCount: 2,
      questions, topic: { title: 'Topic', estimatedMinutes: 40, keyConcepts: [] } }) },
    aiInteraction: { create: async ({ data }) => { logs.push(data); return {}; } },
    quizAttempt: {
      findMany: async ({ where }) => where.quizId ? (previous ? [{ id: 'old' }] : []) : [{ quizId: 'quiz', score: saved.score }],
      create: async ({ data }) => { writes.push('attempt'); saved = data; return { id: 'attempt' }; },
      update: async ({ data }) => { writes.push('attempt update'); saved = data; return { id: 'old' }; },
    },
    userTopicProgress: {
      findUnique: async () => null,
      upsert: async ({ create }) => { writes.push('progress'); progress = create; },
    },
  };
  const route = load('../src/app/api/quizzes/[id]/submit/route.ts', {
    '@clerk/nextjs/server': { auth: async () => ({ userId: 'clerk' }) }, zod,
    '@/lib/db': { db }, '@/lib/ai/feedback': service(provider), '@/lib/ai/feedback-schema': schema,
    '@/lib/ai/config': { AI_MODEL: 'test', isMockMode: mock }, '@/lib/topic-content': load('../src/lib/topic-content.ts'),
    '@/lib/topic-progress': load('../src/lib/topic-progress.ts'),
    '@/lib/ai/usage-limits': { AiQuotaExceededError: class extends Error {}, aiQuotaExceededResponse: () => new Response(), reserveAiUsage: async () => {} },
    '@/lib/ai/usage-metadata': { aiUsageLogData: () => ({}) },
  });
  return { writes, logs, saved: () => saved, progress: () => progress, submit: () => route.POST(new Request('http://localhost/test', {
    method: 'POST', body: JSON.stringify({ answers: questions.map(q => ({ questionId: q.id, userAnswer: 'Answer' })) }),
  }), { params: Promise.resolve({ id: 'quiz' }) }) };
}

test('one invalid grade rejects the whole submission before creating or overwriting results', async () => {
  for (const previous of [false, true]) {
    const h = submissionHarness(async ({ prompt }) => prompt ? JSON.stringify({ ...valid(1), isPartiallyCorrect: true }) : '', previous);
    const response = await h.submit();
    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /Please submit again/);
    assert.equal(h.writes.length, 0);
  }
  let calls = 0;
  const h = submissionHarness(async () => ++calls === 1 ? JSON.stringify(valid(1)) : 'invalid');
  assert.equal((await h.submit()).status, 502);
  assert.equal(h.writes.length, 0);
});

test('valid grades including partial credit persist correct quiz score and progress', async () => {
  let calls = 0;
  const h = submissionHarness(async () => JSON.stringify(valid(++calls === 1 ? 1 : 0.5)));
  const response = await h.submit();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).score, 75);
  assert.equal(h.saved().score, 75);
  assert.equal(h.progress().averageQuizScore, 75);
  assert.equal(h.saved().answers.create[1].isCorrect, false);
  assert.equal(h.saved().answers.create[0].score, 1);
  assert.equal(h.saved().answers.create[1].score, 0.5);
  assert.equal(h.logs.length, 2);
});

test('mock answer grading persists quiz results but does not create audit logs', async () => {
  const h = submissionHarness(async () => JSON.stringify(valid(1)), false, true);
  assert.equal((await h.submit()).status, 200);
  assert.equal(h.saved().score, 100);
  assert.equal(h.progress().averageQuizScore, 100);
  assert.deepEqual(h.logs, []);
});

test('QuizTaker preserves answers and re-enables submission after grading error', async () => {
  const file = new URL('../src/components/quiz/QuizTaker.tsx', import.meta.url);
  const source = ts.createSourceFile(file.pathname, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let submit;
  function visit(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === 'handleSubmit') submit = node.getText(source); ts.forEachChild(node, visit); }
  visit(source); assert(submit);
  const answers = { q0: 'My answer' }; const errors = []; const states = [];
  const context = { answers, questions: [{ id: 'q0' }], quizId: 'quiz',
    setSubmitting: value => states.push(value), setError: value => errors.push(value),
    formatAiQuotaMessage: data => data.error ?? 'Failed to submit quiz',
    router: { push: () => assert.fail('Should not navigate') },
    fetch: async () => ({ ok: false, json: async () => ({ error: 'Please submit again' }) }),
  };
  vm.createContext(context);
  const callback = vm.runInContext(ts.transpileModule(`(${submit})`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText, context);
  await callback();
  assert.deepEqual(answers, { q0: 'My answer' }); assert.deepEqual(states, [true, false]);
  assert.equal(errors.at(-1), 'Please submit again');
});

 test('retaking a quiz saves replacement per-answer points', async () => {
  const h = submissionHarness(async () => JSON.stringify(valid(0.5)), true);
  assert.equal((await h.submit()).status, 200);
  assert.equal(h.saved().answers.create[0].score, 0.5);
  assert.equal(h.saved().answers.create[1].score, 0.5);
 });
