-- CreateEnum
CREATE TYPE "AiUsageBucketType" AS ENUM ('MINUTE', 'DAY');

-- AlterTable
ALTER TABLE "AiInteraction"
ADD COLUMN "promptTokenCount" INTEGER,
ADD COLUMN "outputTokenCount" INTEGER,
ADD COLUMN "totalTokenCount" INTEGER;

-- CreateTable
CREATE TABLE "AiUsageBucket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bucketType" "AiUsageBucketType" NOT NULL,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "unitsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsageBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageBucket_userId_bucketType_bucketStart_key"
ON "AiUsageBucket"("userId", "bucketType", "bucketStart");

-- CreateIndex
CREATE INDEX "AiUsageBucket_userId_bucketStart_idx"
ON "AiUsageBucket"("userId", "bucketStart");

-- AddForeignKey
ALTER TABLE "AiUsageBucket"
ADD CONSTRAINT "AiUsageBucket_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
