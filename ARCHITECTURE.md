# Architecture

## Overview

Learning Loop AI is a Next.js App Router application for structured software engineering study. It combines:

- authenticated user accounts with Clerk
- PostgreSQL persistence through Prisma
- seeded learning paths and topics
- timer-based study sessions
- topic-level mastery tracking
- AI-assisted coaching, summaries, quiz generation, and quiz grading

The core user loop is:

1. choose a learning path
2. open a topic
3. study with the timer and key concepts
4. use AI coaching or quizzes to practice
5. persist progress and recalculate mastery

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Clerk for auth
- Prisma 7 with PostgreSQL
- Gemini-backed AI service layer with mock/real mode

## Project Structure

### App routes

`src/app/` contains the route tree.

Main areas:

- `src/app/page.tsx` - landing page
- `src/app/dashboard/page.tsx` - user overview and recommendations
- `src/app/paths/` - learning path list and path detail pages
- `src/app/topics/[id]/page.tsx` - topic learning page
- `src/app/timer/page.tsx` - study timer flow
- `src/app/quizzes/[id]/page.tsx` - quiz taking
- `src/app/quiz-results/[attemptId]/page.tsx` - quiz results and next step
- `src/app/settings/page.tsx` - appearance settings
- `src/app/api/` - route handlers for AI and client-triggered mutations

### Components

`src/components/` is organized by feature.

Feature directories:

- `ai/` - AI coach and session summary UI
- `dashboard/` - stats and streak cards
- `paths/` - learning path cards
- `quiz/` - quiz generation, quiz taking, results UI
- `settings/` - profile/theme preferences
- `timer/` - study timer client flow
- `topics/` - topic overview, notes, resources, concepts, progress
- `theme/` - client theme plumbing
- `ui/` - reusable primitives

### Shared libraries

`src/lib/` contains shared business logic.

Important files:

- `src/lib/db.ts` - single shared Prisma client
- `src/lib/user.ts` - syncs Clerk users into the local `User` table
- `src/lib/topic-content.ts` - parses JSON-backed key concepts and resources
- `src/lib/topic-progress.ts` - mastery calculation rules and helpers
- `src/lib/theme.ts` - supported accent/theme options
- `src/lib/ai/` - AI service layer

## Rendering Model

The app is server-first.

- Server Components fetch authenticated data directly with Prisma.
- Client Components are used for interactive features like the timer, AI coach, concept toggles, and quiz UI.
- Route Handlers are used for AI workflows and client-side mutations.

This keeps database access on the server while allowing richer client interactions only where needed.

## Authentication Flow

Clerk handles authentication and session state.

Flow:

1. the user signs in with Clerk
2. protected pages call `currentUser()` or `auth()`
3. the app resolves the local DB user through `clerkId`
4. if needed, `syncClerkUser()` creates or updates the local `User` row

Relevant files:

- `src/lib/user.ts`
- `src/app/dashboard/page.tsx`
- `src/app/timer/page.tsx`
- `src/app/settings/page.tsx`

## Database Architecture

The database is modeled around topic progress.

Primary entities:

- `User` - local app user mapped from Clerk
- `LearningPath` - ordered topic collections
- `Topic` - individual study units
- `UserTopicProgress` - per-user progress state for a topic
- `StudySession` - saved timer sessions
- `Quiz` - generated quiz metadata
- `QuizQuestion` - stored questions
- `QuizAttempt` - one completed run of a quiz
- `QuizAnswer` - one answer inside an attempt
- `AiInteraction` - AI audit log and stored coach quiz state

### Why `UserTopicProgress` is central

`UserTopicProgress` is the main derived progress record. It stores:

- mastery score
- progress status
- total study minutes
- quizzes completed
- average quiz score
- covered concept titles
- final quiz pass state

That record is updated from several flows:

- when a study session is saved
- when a concept is marked covered or uncovered
- when a quiz is submitted

## AI Service Layer

All AI behavior lives under `src/lib/ai/`.

Key files:

- `config.ts` - reads `AI_MODE` and `AI_MODEL`
- `coach.ts` - concept coaching responses and quiz evaluation
- `quiz.ts` - quiz generation
- `feedback.ts` - grading for non-multiple-choice answers
- `summary.ts` - study session summaries
- `recommendation.ts` - recommendation logic
- `mock-learning-coach.ts` - mock coach responses

### Mock vs real mode

The AI layer supports:

- `AI_MODE=mock`
- `AI_MODE=real`

Mock mode exists so product and UI work can continue without API cost or live model variability.

## Feature Flows

### Topic learning flow

Entry point:

- `src/app/topics/[id]/page.tsx`

The topic page loads:

- the topic and path context
- the current user’s topic progress
- recent study notes for that topic
- key concepts
- learning resources

From this screen, the user can:

- launch the timer
- toggle covered concepts
- open the AI coach
- generate a quiz

### Concept coverage flow

UI:

- `src/components/topics/KeyConceptsCard.tsx`

API:

- `src/app/api/topics/[id]/concepts/route.ts`

Flow:

1. the user marks a concept covered or uncovered
2. the client sends a `PATCH` request
3. the server validates the concept title against the topic’s allowed concepts
4. `coveredConceptTitles` is updated
5. mastery is recalculated through `computeTopicMastery()`

### Study timer flow

UI:

- `src/components/timer/StudyTimer.tsx`

API:

- `src/app/api/study-sessions/route.ts`
- `src/app/api/ai/session-summary/route.ts`

Flow:

1. the user selects a timer mode and optional topic
2. the timer runs on the client
3. the session ends and is saved to `StudySession`
4. if a topic is attached, `UserTopicProgress.totalStudyMinutes` is updated
5. if the user saved notes, an AI session summary can be generated

### AI learning coach flow

UI:

- `src/components/ai/AiLearningCoach.tsx`

API:

- `src/app/api/ai/coach/route.ts`

Flow:

1. the user selects a key concept
2. the client requests a coach action such as `start`, `explain`, `example`, or `quiz`
3. quiz state is stored in `AiInteraction`
4. follow-up requests for hints or answers read that stored quiz state

This keeps the AI concept-scoped and leaves an audit trail for generated interactions.

### Quiz generation and submission flow

UI:

- `src/components/quiz/QuizGeneratorButton.tsx`
- `src/components/quiz/QuizTaker.tsx`
- `src/components/quiz/QuizResultsSummary.tsx`

API:

- `src/app/api/quizzes/generate/route.ts`
- `src/app/api/quizzes/[id]/submit/route.ts`

Flow:

1. the user chooses quiz settings
2. the server generates quiz content through the AI layer
3. the quiz and questions are persisted
4. the user submits answers
5. answers are graded
6. `QuizAttempt` and `QuizAnswer` records are created
7. topic mastery is recalculated

## Mastery System

The mastery calculation lives in `src/lib/topic-progress.ts`.

Weighted inputs:

- quiz quality: 45%
- study time: 20%
- quiz count: 15%
- covered concepts: 20%

Important gates:

- no activity remains `NOT_STARTED`
- low weighted score after quiz activity becomes `NEEDS_REVIEW`
- most active progress is `IN_PROGRESS`
- `MASTERED` requires both the score threshold and the final mastery quiz gate

Final mastery quiz gate:

- difficulty must be `ADVANCED`
- question count must be `15`
- score must be at least `80`

## Seeded Content

The default curriculum is created by `prisma/seed.ts`.

The seed script:

- creates learning paths
- creates ordered topics
- loads key concept and learning resource content

Seed JSON files live in `prisma/seed-data/`.

## Configuration Boundaries

### Environment variables

Main runtime configuration comes from `.env.local`.

Critical variables:

- Clerk keys
- `DATABASE_URL`
- `DIRECT_URL`
- `GEMINI_API_KEY`
- `AI_MODE`
- `AI_MODEL`

### Prisma 7 specifics

This project uses Prisma 7’s newer setup:

- generated client output goes to `src/generated/prisma`
- datasource URL is configured in `prisma.config.ts`
- runtime DB access uses `DATABASE_URL`
- CLI migration and seed tasks prefer `DIRECT_URL`

## Where To Change Things

If you want to change a feature quickly, start here:

- landing page messaging: `src/app/page.tsx`
- dashboard logic: `src/app/dashboard/page.tsx`
- topic mastery rules: `src/lib/topic-progress.ts`
- AI coach behavior: `src/lib/ai/coach.ts`
- AI mode and model config: `src/lib/ai/config.ts`
- quiz generation behavior: `src/lib/ai/quiz.ts`
- study timer behavior: `src/components/timer/StudyTimer.tsx`
- seed content: `prisma/seed.ts` and `prisma/seed-data/`
