@AGENTS.md

# Learning Loop AI — Project Rules

## Stack
- Next.js App Router (never use Pages Router)
- TypeScript strict mode
- Tailwind CSS + shadcn/ui for all UI
- Prisma ORM + PostgreSQL (Neon)
- Clerk for authentication
- Anthropic API for all AI features

## Architecture Rules

### Components
- Default to Server Components unless the component needs 
  useState, useEffect, event handlers, or browser APIs
- Add "use client" only when necessary and keep client 
  components small
- Co-locate feature components in /components/[feature]/
- Only generic reusable UI goes in /components/ui/

### Data Fetching
- Fetch data in Server Components directly using Prisma
- Use Server Actions for all form submissions and mutations
- Use Route Handlers (route.ts) only for AI endpoints and 
  external API calls that need to be called from the client

### AI Service Layer
- All Anthropic API calls must go through /lib/ai/
- Never call the Anthropic API directly from a component
- AI functions: tutor.ts, quiz.ts, summary.ts, recommendation.ts
- This abstraction allows swapping providers later

### Database
- Single Prisma client instance from /lib/db.ts
- Never instantiate PrismaClient outside of lib/db.ts
- All DB queries in Server Components or Server Actions
- Never expose DB queries to the client

## File & Folder Conventions
- Pages: app/[route]/page.tsx
- Layouts: app/[route]/layout.tsx
- Loading states: app/[route]/loading.tsx
- Error states: app/[route]/error.tsx
- API routes: app/api/[route]/route.ts
- Feature components: components/[feature]/ComponentName.tsx
- Hooks: hooks/use-[name].ts
- Types: types/[name].ts
- Utilities: lib/[name].ts

## TypeScript Rules
- No 'any' types — ever
- All props must have defined interfaces
- Use Zod for all form and API input validation
- Use Prisma-generated types for all database models

## Naming Conventions
- Components: PascalCase (StudyTimer, QuizCard)
- Hooks: camelCase with use prefix (useStudyTimer)
- Files: kebab-case for non-components (study-timer.ts)
- Database fields: camelCase (userId, topicId)
- Environment variables: SCREAMING_SNAKE_CASE

## Learning Documentation

As you build each feature, update LEARNINGS.md with:

1. What was just built and how it works technically
2. Why this approach was chosen over alternatives
3. Any errors or issues encountered and how they were fixed
4. Key concepts a beginner should understand about this code
5. Anything that connects to other parts of the app

Write it as if explaining to someone learning Next.js for the first time.
Update LEARNINGS.md at the end of every completed task, not at the end
of the session.

## What Not To Build (MVP Scope)
Do not build these unless explicitly asked:
- Social/study rooms
- Mobile app
- GitHub integration
- Calendar sync
- Payment system
- User-uploaded notes or RAG pipeline
- Instructor dashboard

