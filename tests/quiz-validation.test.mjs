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
    assert(id in dependencies, id);
    return dependencies[id];
  } });
  return exports;
}
const schema = load('../src/lib/ai/quiz-schema.ts', { zod });
const request = { topicTitle: 'Topic', learningPathTitle: 'Path', difficulty: 'beginner', questionCount: 5, questionType: 'multiple_choice' };
function fixture(count = 5, type = 'multiple_choice') {
  return { questions: Array.from({ length: count }, (_, i) => ({
    questionText: `Question ${i + 1}`, questionType: type,
    ...(type === 'short_answer' ? {} : { options: ['One', 'Two', 'Three', 'Four'] }),
    correctAnswer: 'One', explanation: 'Explanation', orderIndex: i + 1,
  })) };
}
function parse(value, input = request) { return schema.parseGeneratedQuiz(JSON.stringify(value), input); }

test('accepts all requested sizes and formats', () => {
  for (const count of [5, 10, 15]) for (const type of ['multiple_choice', 'short_answer', 'mixed']) {
    const quiz = fixture(count, type === 'mixed' ? 'code_reading' : type);
    if (type === 'mixed') quiz.questions[1].questionType = 'debugging';
    assert.equal(parse(quiz, { ...request, questionCount: count, questionType: type }).questions.length, count);
  }
});

test('rejects malformed JSON and invalid top-level values', () => {
  for (const text of ['not JSON', 'null', '[]', '{}', '{"questions":{}}']) {
    assert.throws(() => schema.parseGeneratedQuiz(text, request), schema.InvalidQuizResponseError);
  }
});

test('rejects malformed fields, choices, answer keys, ordering, and format', () => {
  const changes = [
    q => { q.questionText = ' '; }, q => { delete q.explanation; },
    q => { q.correctAnswer = ''; }, q => { q.correctAnswer = 'Missing'; },
    q => { q.questionType = 'unknown'; }, q => { q.questionType = 'short_answer'; },
    q => { q.questionType = 'code_reading'; }, q => { q.options = ['One']; },
    q => { q.options[3] = 4; }, q => { q.options[3] = ' '; },
    q => { q.options[3] = ' one '; }, q => { delete q.options; },
    q => { q.orderIndex = 2; }, q => { q.orderIndex = 1.5; },
    q => { q.orderIndex = '1'; }, q => { q.extra = 'unexpected'; },
  ];
  for (const change of changes) {
    const quiz = fixture(); change(quiz.questions[0]);
    assert.throws(() => parse(quiz), schema.InvalidQuizResponseError);
  }
  for (const count of [0, 4, 6]) assert.throws(() => parse(fixture(count)), schema.InvalidQuizResponseError);
  const short = fixture(5, 'short_answer'); short.questions[0].options = ['One','Two','Three','Four'];
  assert.throws(() => parse(short, { ...request, questionType: 'short_answer' }), schema.InvalidQuizResponseError);
});

test('code-reading and debugging answers must match a choice; output case is preserved', () => {
  for (const type of ['code_reading', 'debugging']) {
    const quiz = fixture(5, type); quiz.questions[0].correctAnswer = 'wrong';
    assert.throws(() => parse(quiz, { ...request, questionType: 'mixed' }), schema.InvalidQuizResponseError);
  }
  const quiz = fixture(5, 'code_reading'); quiz.questions[0].options = ['Hello', 'hello', 'Hi', 'hi'];
  quiz.questions[0].correctAnswer = 'hello';
  assert.equal(parse(quiz, { ...request, questionType: 'mixed' }).questions[0].correctAnswer, 'hello');
});

function service(text, mock = false) {
  return load('../src/lib/ai/quiz.ts', {
    './config': { isMockMode: mock }, './client': { generateJson: async () => text }, './quiz-schema': schema,
  });
}

test('real service validates provider output; mock fixtures remain compatible', async () => {
  await assert.rejects(service('bad JSON').generateQuiz(request), schema.InvalidQuizResponseError);
  assert.equal((await service(JSON.stringify(fixture())).generateQuiz(request)).questions.length, 5);
  for (const count of [5,10,15]) for (const type of ['multiple_choice','short_answer','mixed']) {
    const input = { ...request, questionCount: count, questionType: type };
    assert.equal(parse(await service('', true).generateQuiz(input), input).questions.length, count);
  }
});

test('generation handler rejects invalid AI output before writing; valid output persists', async () => {
  for (const valid of [false, true]) {
    const writes = [];
    const db = {
      user: { findUnique: async () => ({ id: 'user' }) },
      topic: { findUnique: async () => ({ id: 'topic', title: 'Topic', learningPath: { title: 'Path' } }) },
      quiz: { create: async args => { writes.push(args.data); return { id: 'quiz' }; } },
      aiInteraction: { create: async () => { writes.push('log'); } },
    };
    const route = load('../src/app/api/quizzes/generate/route.ts', {
      '@clerk/nextjs/server': { auth: async () => ({ userId: 'clerk' }) }, zod,
      '@/lib/db': { db }, '@/lib/ai/quiz': service(valid ? JSON.stringify(fixture()) : 'bad JSON'),
      '@/lib/ai/quiz-schema': schema, '@/lib/ai/config': { AI_MODEL: 'test' },
      '@/lib/ai/usage-limits': { AiQuotaExceededError: class extends Error {}, aiQuotaExceededResponse: () => new Response(), reserveAiUsage: async () => {} },
      '@/lib/ai/usage-metadata': { aiUsageLogData: () => ({}) },
    });
    const response = await route.POST(new Request('http://localhost/test', { method: 'POST', body: JSON.stringify({
      topicId: 'topic', difficulty: 'beginner', questionCount: 5, questionType: 'multiple_choice',
    }) }));
    assert.equal(response.status, valid ? 200 : 502);
    if (valid) { assert.equal(writes[0].questions.create.length, 5); }
    else { assert.equal(writes.length, 0); assert.match((await response.json()).error, /No quiz was saved/); }
  }
});
