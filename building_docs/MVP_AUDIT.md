# MVP Exit Audit

**Audited:** 2026-09-07  
**Scope:** Static review of the application, API routes, Prisma schema, automated tests, lint, and production-build attempt. This is not a substitute for testing with a real Clerk tenant, PostgreSQL database, Gemini account, or deployed site.

## Status legend

- **VERIFIED** — supported by automated tests or direct code review.
- **HUMAN TEST REQUIRED** — needs a person in a browser, with a real service, or in production; do not mark complete from code review alone.
- **ACTION REQUIRED** — a concrete MVP gap identified in the audit.
- **BLOCKED** — could not be verified in this environment; the next check is stated.

## Audit summary

The MVP has a complete, well-defined study loop and meaningful protection around quiz validation, answer grading, duplicate timer saves, and protected-resource access. All existing automated suites passed: **44 tests across 8 test files**. These are isolated logic and route-handler tests using mocked services; they do not replace browser E2E or live-service testing.

Before an external MVP release, resolve the action-required items below and complete the human test matrix. The release-critical risks are unbounded client inputs and activity (AI cost/abuse), user-controlled study-duration claims, and lack of production error/usage visibility.

## Release gate

| Area | Status | Evidence / required next step |
| --- | --- | --- |
| Core authenticated study loop | HUMAN TEST REQUIRED | Run the end-to-end journeys below using a new account and an existing account. |
| Authentication and record ownership | VERIFIED | Clerk proxy protects non-public routes; `test:protected-resource-routes` verifies unauthenticated/foreign-user denial for quiz, attempt, and study-session reads or mutations. |
| Topic progress and concept updates | VERIFIED | `test:topic-routes` verifies authenticated topic/progress reads, user-scoped progress queries, and rejection of invalid concept updates. |
| Session-save idempotency and concurrency | VERIFIED | `test:study-sessions` passed 10 tests, including duplicate saves, concurrent progress updates, rollback, and retry behavior. |
| Dashboard recommendation rules | VERIFIED | `test:dashboard` passed 8 tests, including all 125 three-topic status combinations. |
| AI quiz and feedback response validation | VERIFIED | `test:quiz-validation` (6) and `test:feedback-validation` (9) passed. Invalid provider responses are rejected before results/progress update. |
| AI interaction logging behavior | VERIFIED | `test:mock-interaction-logs` passed 4 tests. |
| Quiz-result display correctness | VERIFIED | `test:quiz-results-test` passed 2 tests. |
| Lint | VERIFIED | `npm run lint` completed without diagnostics. |
| Production build | VERIFIED | `npm run build` completed successfully with compilation, TypeScript checks, and static-page generation. It requires normal outbound access for Google Fonts. |
| Automated browser E2E coverage | ACTION REQUIRED | No browser E2E suite or script was found. Add a small critical-path suite before public release. |
| AI rate limiting / quotas | ACTION REQUIRED | No rate-limit or per-user quota control was found on the AI generation, grading, coach, or summary routes. This creates cost and abuse exposure. |
| Request payload limits | ACTION REQUIRED | API schemas validate shape but do not cap text/array length. Bound notes, coach text, answers, `weakTopics`, and score arrays before sending data to the AI provider or database. |
| Study-time integrity | ACTION REQUIRED | The study-session endpoint accepts a client-provided duration with only a minimum of one minute. A user can inflate their own mastery/study totals by calling the API. Choose whether this is acceptable for the MVP; otherwise validate duration against trusted timer/server constraints and set a sensible maximum. |
| Production observability | ACTION REQUIRED | No error-tracking or server-side monitoring integration was found. Add error reporting, structured request/AI failure logs without secrets, and at least one uptime/health check. |
| Privacy, retention, and deletion | ACTION REQUIRED | Notes and real-mode AI prompts/responses are stored, but no user-data export/deletion flow or retention policy is documented. Decide and publish the MVP policy before inviting external users. |
| Accessibility and responsive UI | HUMAN TEST REQUIRED | Requires keyboard, screen-reader, contrast, zoom, mobile, and reduced-motion checks. |
| Real AI quality and cost | HUMAN TEST REQUIRED | Validate live Gemini output, latency, model errors, spend, and refusal/fallback messaging with representative topic inputs. |
| Database migrations, backup, restore | HUMAN TEST REQUIRED | Apply migrations to a disposable production-like database; verify backups and restore procedure with the hosting provider. |

## Findings and tracking checklist

### P0 — complete before an external release

- [ ] **ACTION REQUIRED — Add AI abuse/cost controls.** Rate-limit authenticated users on `POST /api/quizzes/generate`, `/api/quizzes/[id]/submit`, `/api/ai/coach`, and `/api/ai/session-summary`. Define daily/monthly limits, a friendly `429` response, and monitoring for provider failures/cost.
- [ ] **ACTION REQUIRED — Bound untrusted request data.** Add explicit maximum lengths/counts to Zod schemas. At minimum: study notes, quiz answers, `conceptDescription`, `weakTopics`, and `recentQuizScores`. Return `422` for oversized requests.
- [ ] **DECISION REQUIRED — Define study-time trust.** Either accept that self-reported study time is an MVP product choice, document it, and cap a single session; or change the design so a forged request cannot award arbitrary topic progress.
- [ ] **ACTION REQUIRED — Add production error and availability visibility.** Instrument unhandled route errors, AI-provider errors, database failures, and build/deployment failures. Verify alerts reach an owner.
- [ ] **HUMAN TEST REQUIRED — Test with live credentials.** Complete the end-to-end matrix and real-AI checks below. Record date, tester, environment, and result in this file or an issue tracker.

### P1 — complete immediately after first release, or before handling sensitive/large-scale user data

- [ ] **ACTION REQUIRED — Add browser E2E smoke coverage.** Cover sign-in, create/save a linked session, generate/take/submit a quiz, and verify results and dashboard progress. Keep mock AI for deterministic CI; run a separate manual real-AI smoke test.
- [ ] **ACTION REQUIRED — Handle malformed JSON consistently.** Each route calls `request.json()` directly. Malformed request bodies can become unhandled 500s; return a safe 400 response instead.
- [ ] **ACTION REQUIRED — Decide privacy operations and retention.** Establish the retention period for `StudySession.notes` and `AiInteraction` prompt/response logs; give users a deletion path; publish a privacy notice suitable for the audience/location.
- [ ] **HUMAN TEST REQUIRED — Validate data lifecycle.** In a production-like environment, run migrations, seed only intended data, test backup restore, and verify that a Clerk user deletion has the expected application-data outcome.

### P2 — usability and quality follow-up

- [ ] **HUMAN TEST REQUIRED — Accessibility review.** Keyboard-only completion of timer, quiz, concept checkboxes, settings, and error/retry UI; screen-reader labels and announcements; 200% zoom; contrast; reduced motion.
- [ ] **HUMAN TEST REQUIRED — Responsive/browser review.** Test iPhone-sized, tablet, and desktop layouts in current Safari, Chrome, and Firefox; include a slow/offline network pass.
- [ ] **ACTION REQUIRED — Test concurrent concept toggles.** Concept coverage is a read-modify-write update. Decide whether the rare same-user multi-tab race is acceptable or make the update transactional/retryable.

## Human test matrix

| Journey | Status | Tester / date / environment | Expected result |
| --- | --- | --- | --- |
| New-account activation | [ ] |  | Sign up, local user sync, dashboard redirect, and seeded paths work. |
| First learning loop | [ ] |  | Open topic, complete a timer session with notes, see it on topic/dashboard, generate and submit quiz. |
| Returning learner | [ ] |  | Existing sessions, concepts, quiz results, mastery, and recommendation persist after sign out/in. |
| Timer behavior | [ ] |  | Pause/resume, focus-break transitions, custom zero break, retry after lost save response, and no break-time credit. |
| Quiz behavior | [ ] |  | All offered modes/counts, unanswered questions, grading failure retry, quiz retake, and result display. |
| Real Gemini | [ ] |  | Generate multiple quizzes, summaries, coach lessons/examples/quizzes/hints; assess factual quality, latency, failures, and cost. |
| Authorization | [ ] |  | Two accounts: attempt direct API/page access to the other account's quiz, attempt, and session IDs; access is denied without leaks. |
| Mobile + keyboard | [ ] |  | Complete the primary loop using keyboard and a phone-sized viewport. |
| Production operations | [ ] |  | CI/deployment build passes, migrations apply, error monitoring reports a synthetic failure, backup restore is confirmed. |

## Commands executed during this audit

```text
npm test                            PASS (44 tests across 8 test files)
npm run test:study-sessions        PASS (10 tests)
npm run test:dashboard             PASS (8 tests)
npm run test:quiz-validation       PASS (6 tests)
npm run test:feedback-validation   PASS (9 tests)
npm run test:mock-interaction-logs PASS (4 tests)
npm run test:quiz-results-test     PASS (2 tests)
npm run lint                       PASS (no diagnostics)
npm run build                      PASS (production build, TypeScript, and static-page generation)
```

## Suggested MVP release decision

Do not use this audit as proof that the product is ready until every P0 box is resolved or explicitly accepted by the product owner, and the relevant human matrix rows are completed. P1/P2 items can be scheduled, but privacy retention must be decided before storing external users' data in real AI mode.
