# Learning Loop AI

Learning Loop AI is a structured study app for learning software engineering topics through active recall instead of passive reading. It combines guided learning paths, topic-level mastery tracking, a focus timer, AI-generated quizzes, and a concept-based AI coach in one workflow.

## Why This Project Exists

Most AI learning tools stop at "ask a chatbot anything." That is flexible, but it does not create much structure, repetition, or measurable progress.

Learning Loop AI was created to make studying feel more intentional:

- follow a real learning path instead of bouncing between random topics
- study in focused sessions with a timer
- practice retrieval with quizzes
- track mastery at the topic level
- use AI as a guided coach, not just an open-ended chat box

The goal is to support a loop like this:

1. pick a topic
2. study with focus
3. practice concepts
4. test understanding
5. review weak areas
6. repeat until mastery

## What The App Includes

### Learning paths

The app ships with seeded learning paths and ordered topics:

- Frontend Fundamentals
- Python Foundations
- Computer Science Fundamentals

Each path contains topics with:

- a description
- difficulty level
- estimated study time
- key concepts
- learning resources

### Dashboard

The dashboard is the main study snapshot for a signed-in user. It shows:

- study time today
- study time this week
- current streak
- last studied topic
- recent quiz attempts
- topics in progress
- weak topics that need review
- a recommended next topic based on existing progress

### Topic pages

Each topic page is the main learning surface. It includes:

- topic overview
- key concepts list
- external learning resources
- recent session notes for that topic
- current mastery and status
- direct actions to start the timer, open the AI coach, or generate a quiz

### Key concept tracking

Users can mark individual topic concepts as covered. That updates `UserTopicProgress.coveredConceptTitles` and immediately recalculates mastery for that topic.

### Study timer

The timer supports three modes:

- `POMODORO` - 25 minute focus, 5 minute break
- `DEEP_WORK` - 50 minute focus, 10 minute break
- `CUSTOM` - user-defined focus and break lengths

How it works:

- a user optionally attaches the session to a topic
- the timer tracks focus time and break transitions in the client
- when the session ends, the app saves a `StudySession`
- if a topic was selected, topic progress is updated with the new study minutes
- if notes are added, the app can generate an AI session summary

### AI learning coach

The AI coach is concept-driven, not open chat.

How it works:

1. the user picks one key concept from a topic
2. the coach starts with a short lesson
3. the user can ask for an explanation, example, or quiz
4. the coach can give a hint for quiz questions
5. quiz state is stored in `AiInteraction` records so answer evaluation can continue across requests

This keeps the AI focused on teaching one concept at a time.

### AI-generated quizzes

Users can generate quizzes per topic with configurable settings:

- difficulty: `beginner`, `intermediate`, `advanced`
- question count: `5`, `10`, `15`
- question type: `multiple_choice`, `short_answer`, `mixed`

How it works:

- the app calls the quiz generation service in `src/lib/ai/quiz.ts`
- the generated quiz is stored in the database as a `Quiz` with `QuizQuestion` records
- the user takes the quiz in the UI
- answers are submitted to `/api/quizzes/[id]/submit`
- short-answer and code-reading responses can use AI grading and feedback
- the completed attempt is stored in `QuizAttempt` and `QuizAnswer`
- topic mastery is recalculated after submission

### Mastery scoring

Topic mastery is weighted across four signals:

- quiz quality: 45%
- study time: 20%
- quiz count: 15%
- covered concepts: 20%

Important rules:

- users need an advanced 15-question quiz score of at least 80% to fully master a topic
- weighted scores under 40 after quiz activity move the topic to `NEEDS_REVIEW`
- otherwise progress is usually `IN_PROGRESS`
- `MASTERED` is only awarded when the final quiz gate is passed and the weighted score threshold is met

### Session summaries

After a saved timer session with notes, the app can generate an AI study summary with:

- a recap of the session
- key takeaways
- weak areas
- a recommended next step

### Authentication and settings

The app uses Clerk for sign-up, sign-in, and session management. On first use, Clerk users are synced into the local `User` table.

Users can also save appearance preferences:

- theme mode
- accent color

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Prisma 7
- PostgreSQL
- Clerk
- Anthropic SDK

## Running The Project Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

Required environment variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `ANTHROPIC_API_KEY`
- `AI_MODE`
- `AI_MODEL`

Notes:

- `DATABASE_URL` is the app runtime connection string.
- `DIRECT_URL` is used by Prisma CLI commands like migrations and seeding.
- For Neon, `DIRECT_URL` should be the direct non-pooled connection.
- During normal UI development, keep `AI_MODE=mock`.

### 3. Generate the Prisma client

```bash
npm run db:generate
```

This creates the Prisma client in `src/generated/prisma`.

### 4. Run migrations

```bash
npm run db:migrate
```

This applies the Prisma migrations in `prisma/migrations` to your local database.

### 5. Seed the database

```bash
npm run db:seed
```

This loads the default learning paths, topics, key concepts, and learning resources.

### 6. Start the dev server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Database Commands Explained

The project uses these npm scripts:

### `npm run db:generate`

Runs:

```bash
prisma generate
```

Use this when:

- dependencies were just installed
- the Prisma schema changed
- the generated client is missing

### `npm run db:migrate`

Runs:

```bash
prisma migrate dev
```

Use this when:

- you changed `prisma/schema.prisma`
- you want Prisma to create and apply a new local migration
- you want your local database structure to match the schema

What it does:

- compares your schema to the database
- creates a new migration if needed
- applies pending migrations
- updates the generated Prisma client

### `npm run db:seed`

Runs:

```bash
prisma db seed
```

Use this when:

- you want the starter learning content loaded
- you reset the database
- you want fresh local data for manual testing

### `npm run db:studio`

Runs:

```bash
prisma studio
```

Use this to inspect and edit database records in a local browser UI.

## AI Modes

The AI layer supports mock and real modes.

### Mock mode

```env
AI_MODE=mock
```

Use this for:

- UI development
- faster local testing
- avoiding API costs

In mock mode, the app returns realistic hardcoded AI responses for the coach, quiz generation, feedback, summaries, and recommendations.

### Real mode

```env
AI_MODE=real
```

Use this when you want to test actual Anthropic-backed responses.

Default model:

```env
AI_MODEL=claude-haiku-4-5-20251001
```

## Core Data Model

Main tables:

- `User` - app-level user record synced from Clerk
- `LearningPath` - a structured topic collection
- `Topic` - a study unit inside a path
- `UserTopicProgress` - mastery, study minutes, covered concepts, quiz stats, final quiz gate
- `StudySession` - completed timer sessions
- `Quiz` - generated quizzes
- `QuizQuestion` - quiz question records
- `QuizAttempt` - a user's completed quiz run
- `QuizAnswer` - answers and per-question feedback
- `AiInteraction` - audit log for AI calls and stored coach quiz state

## Main Routes

- `/` - landing page
- `/dashboard` - study overview
- `/paths` - learning paths list
- `/paths/[id]` - path detail page
- `/topics/[id]` - topic learning page
- `/timer` - study timer
- `/quizzes/[id]` - quiz taking page
- `/quiz-results/[attemptId]` - results and next-step recommendations
- `/settings` - appearance settings

## Seeded Content

The seeded curriculum currently lives in:

- [prisma/seed.ts](/Volumes/Mac Mini Drive/Code/learning-loop-ai/prisma/seed.ts)
- [prisma/seed-data/frontend-fundamentals.json](/Volumes/Mac Mini Drive/Code/learning-loop-ai/prisma/seed-data/frontend-fundamentals.json)
- [prisma/seed-data/python-foundations.json](/Volumes/Mac Mini Drive/Code/learning-loop-ai/prisma/seed-data/python-foundations.json)
- [prisma/seed-data/cs-fundamentals.json](/Volumes/Mac Mini Drive/Code/learning-loop-ai/prisma/seed-data/cs-fundamentals.json)

## Useful Project Files

- [ARCHITECTURE.md](/Volumes/Mac Mini Drive/Code/learning-loop-ai/ARCHITECTURE.md) - app structure, data flow, and major system responsibilities
- [DEPLOYMENT.md](/Volumes/Mac Mini Drive/Code/learning-loop-ai/DEPLOYMENT.md) - environment, database, auth, and production launch checklist
- [TESTING.md](/Volumes/Mac Mini Drive/Code/learning-loop-ai/TESTING.md) - practical manual test plan for the current product flows
- [prisma/schema.prisma](/Volumes/Mac Mini Drive/Code/learning-loop-ai/prisma/schema.prisma) - database schema
- [src/lib/topic-progress.ts](/Volumes/Mac Mini Drive/Code/learning-loop-ai/src/lib/topic-progress.ts) - mastery scoring rules

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```
