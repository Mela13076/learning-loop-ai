import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/components/quiz/QuizResultsSummary.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports, require: () => jsx });

function render(scores) {
  return renderToStaticMarkup(jsx.jsx(exports.QuizResultsSummary, {
    quizTitle: 'Quiz', topicTitle: 'Topic', score: 80, totalQuestions: scores.length,
    answers: scores.map((score, i) => ({
      id: String(i), score, isCorrect: score === 1, userAnswer: 'My answer', feedback: 'Feedback',
      question: { id: String(i), questionText: `Prompt ${i}`, questionType: 'SHORT_ANSWER',
        options: [], correctAnswer: 'Expected', explanation: 'Explanation', orderIndex: i },
    })),
  }));
}

test('partial credit explains 80 percent and remains yellow in review and breakdown', () => {
  const html = render([1, 1, 1, 0.5, 0.5]);
  assert.match(html, /3 \/ 5 fully correct · 2 partially correct/);
  assert.match(html, /4 \/ 5 points earned/);
  assert.match(html, /Areas to Review \(2\)/);
  assert.equal((html.match(/Partially correct · 0.5 \/ 1 point/g) || []).length, 4);
  assert.match(html, /border-yellow-200/);
  assert.doesNotMatch(html, /text-red|border-red/);
});

test('zero credit stays red and unknown older grades do not invent points', () => {
  const html = render([1, 0, null]);
  assert.match(html, /Incorrect · 0 \/ 1 point/);
  assert.match(html, /border-red-200/);
  assert.match(html, /Needs review · Points unavailable for this older answer/);
  assert.match(html, /Areas to Review \(2\)/);
  assert.doesNotMatch(html, /points earned/);
});
