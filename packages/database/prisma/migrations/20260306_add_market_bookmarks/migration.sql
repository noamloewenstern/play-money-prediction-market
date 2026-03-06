-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MARKET_BOOKMARK_RESOLVED';

-- CreateTable
CREATE TABLE "MarketBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketBookmark_userId_idx" ON "MarketBookmark"("userId");

-- CreateIndex
CREATE INDEX "MarketBookmark_marketId_idx" ON "MarketBookmark"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketBookmark_userId_marketId_key" ON "MarketBookmark"("userId", "marketId");

-- AddForeignKey
ALTER TABLE "MarketBookmark" ADD CONSTRAINT "MarketBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketBookmark" ADD CONSTRAINT "MarketBookmark_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
