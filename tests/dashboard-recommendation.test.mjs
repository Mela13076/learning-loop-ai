import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the pure TypeScript helper without loading Next.js or the database.
const source = fs.readFileSync(new URL('../src/lib/dashboard-recommendation.ts', import.meta.url), 'utf8');
const exports = {};
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports });
const { getDashboardRecommendation: recommend } = exports;
const topic = (id) => ({ id, title: `Topic ${id}`, estimatedMinutes: 25 });
const paths = [
  { title: 'First path', topics: [topic('a'), topic('b')] },
  { title: 'Second path', topics: [topic('c')] },
];
const progress = (entries) => new Map(entries.map(([id, status]) => [id, { status }]));

test('in-progress topic in later path outranks earlier unstarted and review topics', () => {
  const result = recommend(paths, progress([['b', 'NEEDS_REVIEW'], ['c', 'IN_PROGRESS']]));
  assert.equal(result.kind, 'topic');
  assert.equal(result.topic.id, 'c');
  assert.equal(result.topic.pathTitle, 'Second path');
  assert.equal(result.actionLabel, 'Continue topic');
});

test('review topic outranks an unstarted topic', () => {
  const result = recommend(paths, progress([['b', 'NEEDS_REVIEW']]));
  assert.equal(result.topic.id, 'b');
  assert.equal(result.actionLabel, 'Review topic');
});

test('explicit NOT_STARTED and absent progress both remain eligible', () => {
  for (const entries of [[['a', 'NOT_STARTED']], []]) {
    const result = recommend(paths, progress(entries));
    assert.equal(result.topic.id, 'a');
    assert.equal(result.actionLabel, 'Start topic');
  }
});

test('ties preserve provided curriculum order, not progress insertion order', () => {
  const states = progress([['c', 'IN_PROGRESS'], ['b', 'IN_PROGRESS']]);
  assert.equal(recommend(paths, states).topic.id, 'b');
  const reversed = [paths[1], paths[0]];
  assert.equal(recommend(reversed, states).topic.id, 'c');
});

test('empty paths do not imply mastery', () => {
  assert.equal(recommend([], new Map()).kind, 'empty');
  assert.equal(recommend([{ title: 'Empty', topics: [] }], new Map()).kind, 'empty');
});

test('mastery considers only available topics and requires every one mastered', () => {
  const states = progress([['a', 'MASTERED'], ['b', 'MASTERED'], ['c', 'MASTERED'], ['old', 'NEEDS_REVIEW']]);
  assert.equal(recommend(paths, states).kind, 'all_mastered');
  states.delete('c');
  assert.equal(recommend(paths, states).topic.id, 'c');
});

test('all 125 status combinations select highest priority or actual completion', () => {
  const statuses = [undefined, 'NOT_STARTED', 'NEEDS_REVIEW', 'IN_PROGRESS', 'MASTERED'];
  const rank = { IN_PROGRESS: 0, NEEDS_REVIEW: 1, NOT_STARTED: 2, MASTERED: 3 };
  for (const a of statuses) for (const b of statuses) for (const c of statuses) {
    const entries = [['a', a], ['b', b], ['c', c]];
    const states = progress(entries.filter(([, state]) => state !== undefined));
    const eligible = entries.filter(([, state]) => state !== 'MASTERED')
      .sort((x, y) => rank[x[1] ?? 'NOT_STARTED'] - rank[y[1] ?? 'NOT_STARTED']);
    const result = recommend(paths, states);
    assert.equal(result.kind, eligible.length ? 'topic' : 'all_mastered');
    if (eligible.length) assert.equal(result.topic.id, eligible[0][0]);
  }
});

test('selection does not mutate curriculum or progress', () => {
  const states = progress([['c', 'IN_PROGRESS']]);
  const before = JSON.stringify([paths, [...states]]);
  recommend(paths, states);
  assert.equal(JSON.stringify([paths, [...states]]), before);
});
