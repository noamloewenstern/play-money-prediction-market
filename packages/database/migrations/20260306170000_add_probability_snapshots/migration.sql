-- CreateTable
CREATE TABLE "MarketProbabilitySnapshot" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "snapshots" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketProbabilitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketProbabilitySnapshot_marketId_createdAt_idx" ON "MarketProbabilitySnapshot"("marketId", "createdAt");

-- AddForeignKey
ALTER TABLE "MarketProbabilitySnapshot" ADD CONSTRAINT "MarketProbabilitySnapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
