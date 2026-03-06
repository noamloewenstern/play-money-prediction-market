-- CreateEnum
CREATE TYPE "AlertDirection" AS ENUM ('ABOVE', 'BELOW');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MARKET_PROBABILITY_ALERT';

-- CreateTable
CREATE TABLE "ProbabilityAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "direction" "AlertDirection" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProbabilityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProbabilityAlert_userId_marketId_optionId_threshold_direction_key" ON "ProbabilityAlert"("userId", "marketId", "optionId", "threshold", "direction");

-- CreateIndex
CREATE INDEX "ProbabilityAlert_marketId_isActive_idx" ON "ProbabilityAlert"("marketId", "isActive");

-- CreateIndex
CREATE INDEX "ProbabilityAlert_userId_idx" ON "ProbabilityAlert"("userId");

-- AddForeignKey
ALTER TABLE "ProbabilityAlert" ADD CONSTRAINT "ProbabilityAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProbabilityAlert" ADD CONSTRAINT "ProbabilityAlert_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProbabilityAlert" ADD CONSTRAINT "ProbabilityAlert_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "MarketOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
