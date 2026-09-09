ALTER TABLE "QuizAnswer" ADD COLUMN "score" DOUBLE PRECISION;

-- Only recover grades that are unambiguous. Older AI-graded answers that
-- were not fully correct may have earned either zero or half credit.
UPDATE "QuizAnswer" SET "score" = 1 WHERE "isCorrect" = true;
UPDATE "QuizAnswer" AS answer SET "score" = 0
FROM "QuizQuestion" AS question
WHERE answer."questionId" = question."id"
  AND answer."isCorrect" = false
  AND question."questionType" IN ('MULTIPLE_CHOICE', 'DEBUGGING');
