# Deployment

## Overview

This project is a Next.js application with external dependencies on:

- Clerk for authentication
- PostgreSQL for persistence
- Gemini for real AI mode

A successful deployment needs hosting, database configuration, auth configuration, and environment variable setup to agree with each other.

## Deployment Requirements

You need:

- a production host for the Next.js app
- a production PostgreSQL database
- a Clerk application configured for the deployed domain
- a Gemini API key if production will use `AI_MODE=real`

## Required Environment Variables

These values need to exist in production:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `GEMINI_API_KEY`
- `AI_MODE`
- `AI_MODEL`

## Environment Variable Notes

### Clerk

Clerk values must match the production Clerk app and allowed URLs for your deployed domain.

Typical values:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

### Database

This project uses two database URLs:

- `DATABASE_URL` for app runtime queries
- `DIRECT_URL` for Prisma CLI operations such as migrations and seeds

If you use Neon:

- `DATABASE_URL` should usually be the pooled connection
- `DIRECT_URL` should be the direct non-pooled connection

### AI mode

For lower-cost or demo environments:

```env
AI_MODE=mock
```

For live model-backed behavior:

```env
AI_MODE=real
AI_MODEL=gemini-2.5-flash-lite
```

## Build And Release Flow

A safe deploy order is:

1. provision the production database
2. configure production environment variables
3. apply Prisma migrations
4. seed the database if you want starter curriculum in production
5. build and deploy the app
6. test authentication, topic pages, timer saves, and quiz generation

## Database Setup

### 1. Provision PostgreSQL

Create a production database and collect:

- pooled connection string
- direct connection string

### 2. Apply migrations

Before or during deploy, run:

```bash
npm run db:migrate
```

This script currently uses `prisma migrate dev`, which is appropriate for local development. For a stricter production workflow, it is usually better to apply checked-in migrations in CI/CD with a production-safe command and keep `db:migrate` for local development only.

### 3. Seed content if needed

If production should include the starter learning paths and topics, run:

```bash
npm run db:seed
```

Do this once per environment unless you intentionally want to reseed content.

## Clerk Production Setup

In Clerk, verify:

- production domain is registered
- sign-in URL matches `/login`
- sign-up URL matches `/signup`
- redirect URLs allow `/dashboard`

If Clerk is misconfigured, the app may build successfully but fail at login or redirect loops.

## Host Configuration

This is a standard Next.js server deployment. Any host that supports modern Next.js can work, as long as it supports:

- environment variables
- server-side rendering
- a Node.js runtime compatible with the project dependencies

Before deploying, make sure the host can:

- reach the production database
- reach Clerk
- reach Gemini API if `AI_MODE=real`

## Recommended Pre-Deploy Checklist

- `npm install` succeeds
- `npm run build` succeeds
- env vars are configured in the host
- database is reachable from the host
- migrations have been applied
- seed data has been loaded if desired
- Clerk production URLs are configured
- AI mode is intentionally chosen

## Recommended Post-Deploy Checklist

After the app is live, verify:

1. landing page loads
2. sign-up works
3. sign-in works
4. dashboard loads for a new user
5. learning paths render
6. a topic page loads
7. concept toggles persist
8. a timer session can be saved
9. a quiz can be generated
10. a quiz can be submitted
11. settings persist

## Common Deployment Risks

### Missing `DIRECT_URL`

Symptoms:

- Prisma migration or seed commands fail

Cause:

- CLI tasks need a direct DB connection in this setup

### Using `AI_MODE=real` without `GEMINI_API_KEY`

Symptoms:

- AI routes fail at runtime

Cause:

- real mode expects a live provider key

### Clerk redirects not matching deployed URLs

Symptoms:

- login succeeds but redirect fails
- auth loops
- protected pages bounce back to login

Cause:

- Clerk dashboard settings and app env vars do not agree

### Database accessible locally but not from the host

Symptoms:

- server-rendered pages fail when they hit the database
- authenticated pages error after deployment

Cause:

- network rules, allowlists, or wrong connection strings

## Suggested CI/CD Improvements

The repo can be deployed manually today, but these improvements would make it safer:

- add a production-safe migration script separate from local `db:migrate`
- add build validation in CI
- add lint validation in CI
- add automated smoke tests against preview deployments

## Useful Commands

Local validation before deploy:

```bash
npm run build
npm run lint
```

Database workflow:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```
