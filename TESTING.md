# Testing

## Overview

This repo does not currently include an automated test suite. The most reliable way to validate changes today is targeted manual testing against the real product flows.

This document is a practical checklist for testing the current app.

## Recommended Local Setup

Before testing:

1. install dependencies
2. configure `.env.local`
3. run Prisma generate
4. run migrations
5. seed the database
6. start the dev server

Commands:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Recommended environment mode for most manual testing:

```env
AI_MODE=mock
```

Use `AI_MODE=real` only when validating actual model output quality.

## Smoke Test Checklist

Run this after pulling changes or before sharing the project:

- app loads at `/`
- sign-up and sign-in pages load
- authenticated user can reach `/dashboard`
- learning paths render on `/paths`
- a path detail page loads
- a topic page loads
- study timer opens and starts
- quiz generation works
- quiz submission works
- settings page loads and saves preferences

## Feature Test Plan

### Authentication

Goal:

Confirm Clerk auth and local user sync work correctly.

Test steps:

1. sign up with a new account
2. confirm redirect to `/dashboard`
3. check that a `User` row exists in the database
4. sign out
5. sign back in
6. confirm existing data is still tied to the same account

Verify:

- protected pages redirect signed-out users to `/login`
- `syncClerkUser()` creates a local user on first access
- returning users keep the same progress data

### Learning paths

Goal:

Confirm seeded curriculum is visible and ordered correctly.

Test steps:

1. open `/paths`
2. confirm all seeded learning paths appear
3. open each path
4. verify topics are shown in ascending order
5. confirm topic difficulty and estimated minutes display correctly

Verify:

- no empty path cards unless seed data is actually missing
- the path CTA points to the correct next topic

### Topic page

Goal:

Confirm the topic page loads the full learning surface.

Test steps:

1. open a topic page
2. verify overview text appears
3. verify key concepts render
4. verify learning resources render
5. verify progress card loads without errors
6. verify AI coach section appears
7. verify quiz generator opens

Verify:

- breadcrumb links work
- previous and next topic links work
- empty progress state is handled cleanly for a new user

### Key concept tracking

Goal:

Confirm concept completion updates both UI and persisted progress.

Test steps:

1. open a topic with multiple concepts
2. mark one concept covered
3. refresh the page
4. confirm the concept remains covered
5. mark it uncovered
6. refresh again
7. confirm it is no longer covered

Verify:

- the covered concept count updates
- `UserTopicProgress.coveredConceptTitles` changes in the database
- mastery score and status change when expected

### Study timer

Goal:

Confirm timer modes, session saving, and notes flow work correctly.

Test steps:

1. open `/timer`
2. test `POMODORO`
3. test `DEEP_WORK`
4. test `CUSTOM` with a short duration
5. attach the session to a topic
6. end the session
7. add notes
8. save the session

Verify:

- timer starts, pauses, resumes, and ends correctly
- break transitions behave correctly
- the saved session appears in the database
- topic-linked sessions increase `totalStudyMinutes`
- topic notes appear later on the topic page

### AI session summary

Goal:

Confirm the timer can trigger session summaries after saving notes.

Test steps:

1. complete a topic-linked session
2. enter session notes
3. save the session
4. wait for summary generation

Verify:

- summary appears when notes are present
- failure to generate a summary does not break session saving
- an `AiInteraction` row is created for `STUDY_SUMMARY`

### AI learning coach

Goal:

Confirm the coach stays concept-scoped and supports the intended flow.

Test steps:

1. open a topic page
2. choose a concept
3. trigger the initial lesson
4. click `Explain Concept`
5. click `Show Example`
6. click `Quiz Me`
7. request a hint
8. submit an answer
9. change concepts

Verify:

- each request stays tied to the selected concept
- quiz state survives the hint and answer cycle
- the UI handles loading and error states cleanly
- `AiInteraction` rows are created for coach events

### Quiz generation

Goal:

Confirm the quiz generator creates persisted quizzes with the selected settings.

Test steps:

1. open a topic page
2. generate a quiz with:
   beginner / 5 / multiple choice
3. generate a quiz with:
   intermediate / 10 / mixed
4. generate a quiz with:
   advanced / 15 / mixed
5. confirm each quiz page loads

Verify:

- the correct number of questions is created
- the quiz title references the topic and difficulty
- questions render in order

### Quiz submission and results

Goal:

Confirm answer grading, attempt storage, and result pages work.

Test steps:

1. answer a generated quiz
2. submit the quiz
3. confirm redirect to results
4. review per-question feedback
5. return to the topic page

Verify:

- a `QuizAttempt` row is created
- `QuizAnswer` rows are created
- score is calculated correctly
- topic progress updates after submission
- recommended next step reflects updated mastery

### Mastery progression

Goal:

Confirm topic mastery reflects real user actions.

Suggested sequence:

1. start with a fresh user
2. mark some concepts covered
3. complete one or more study sessions on the topic
4. complete a quiz
5. inspect the topic page progress card
6. inspect the `UserTopicProgress` row in Prisma Studio

Verify:

- study time increases the score gradually
- concept coverage affects the score
- low quiz results can move a topic to `NEEDS_REVIEW`
- mastery never reaches `100` without the final quiz gate

### Final mastery gate

Goal:

Confirm a topic only becomes `MASTERED` after the intended final quiz condition.

Test steps:

1. generate an advanced 15-question quiz
2. achieve a score of at least 80%
3. confirm the topic only reaches `MASTERED` if the weighted threshold is also satisfied

Verify:

- `finalQuizPassed` becomes true
- `finalQuizPassedAt` is populated
- status changes to `MASTERED` only when all conditions are met

### Settings and theme

Goal:

Confirm user appearance settings persist.

Test steps:

1. open `/settings`
2. change accent color
3. change theme mode
4. refresh the page
5. sign out and sign back in

Verify:

- selected settings persist
- stored values match the `User` row

## Database Validation

Use Prisma Studio during manual testing:

```bash
npm run db:studio
```

Useful tables to inspect:

- `User`
- `UserTopicProgress`
- `StudySession`
- `Quiz`
- `QuizAttempt`
- `QuizAnswer`
- `AiInteraction`

## Suggested Regression Areas After Changes

If you change one area, also retest these:

- `src/lib/topic-progress.ts`
  Retest topic progress, concept toggles, timer saves, quiz submission, and results.
- `src/lib/ai/`
  Retest AI coach, quiz generation, answer grading, and summary generation.
- `prisma/schema.prisma`
  Rerun generate, migrate, seed, and smoke test the major flows.
- `src/lib/user.ts` or auth logic
  Retest sign-in, redirects, dashboard access, settings, timer, and quiz flows.

## Current Testing Gaps

The repo would benefit from:

- unit tests for `src/lib/topic-progress.ts`
- integration tests for route handlers
- end-to-end coverage for auth, timer, quiz, and mastery flows

The highest-value first automated tests would be:

1. mastery calculation unit tests
2. quiz submission route tests
3. concept toggle route tests
4. one end-to-end happy path from sign-in to mastered topic
