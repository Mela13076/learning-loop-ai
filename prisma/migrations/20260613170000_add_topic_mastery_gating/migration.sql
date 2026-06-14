-- Persist per-topic concept completion and final quiz mastery gating.
ALTER TABLE "UserTopicProgress"
ADD COLUMN "coveredConceptTitles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "finalQuizPassed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "finalQuizPassedAt" TIMESTAMP(3);
