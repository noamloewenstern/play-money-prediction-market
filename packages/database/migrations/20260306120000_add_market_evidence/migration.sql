-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('FOR', 'AGAINST', 'NEUTRAL');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MARKET_EVIDENCE_ADDED';

-- CreateTable
CREATE TABLE "MarketEvidence" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT,
    "evidenceType" "EvidenceType" NOT NULL DEFAULT 'NEUTRAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketEvidenceVote" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isUpvote" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketEvidenceVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketEvidence_marketId_idx" ON "MarketEvidence"("marketId");

-- CreateIndex
CREATE INDEX "MarketEvidence_authorId_idx" ON "MarketEvidence"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketEvidenceVote_evidenceId_userId_key" ON "MarketEvidenceVote"("evidenceId", "userId");

-- CreateIndex
CREATE INDEX "MarketEvidenceVote_evidenceId_idx" ON "MarketEvidenceVote"("evidenceId");

-- CreateIndex
CREATE INDEX "MarketEvidenceVote_userId_idx" ON "MarketEvidenceVote"("userId");

-- AddForeignKey
ALTER TABLE "MarketEvidence" ADD CONSTRAINT "MarketEvidence_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketEvidence" ADD CONSTRAINT "MarketEvidence_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketEvidenceVote" ADD CONSTRAINT "MarketEvidenceVote_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "MarketEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketEvidenceVote" ADD CONSTRAINT "MarketEvidenceVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
