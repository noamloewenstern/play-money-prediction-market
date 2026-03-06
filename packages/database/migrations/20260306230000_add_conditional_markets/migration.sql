-- AlterTable: add conditional market fields to Market
ALTER TABLE "Market" ADD COLUMN "parentMarketId" TEXT;
ALTER TABLE "Market" ADD COLUMN "conditionResolution" TEXT;
ALTER TABLE "Market" ADD COLUMN "activatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Market_parentMarketId_idx" ON "Market"("parentMarketId");

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_parentMarketId_fkey" FOREIGN KEY ("parentMarketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterEnum: add CONDITIONAL_MARKET_ACTIVATED to NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'CONDITIONAL_MARKET_ACTIVATED';
