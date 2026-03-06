-- CreateTable
CREATE TABLE "TradeNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "tradeType" TEXT NOT NULL,
    "note" TEXT,
    "probabilityAtTrade" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TradeNote_transactionId_key" ON "TradeNote"("transactionId");

-- CreateIndex
CREATE INDEX "TradeNote_userId_createdAt_idx" ON "TradeNote"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TradeNote_marketId_idx" ON "TradeNote"("marketId");

-- CreateIndex
CREATE INDEX "TradeNote_transactionId_idx" ON "TradeNote"("transactionId");

-- AddForeignKey
ALTER TABLE "TradeNote" ADD CONSTRAINT "TradeNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeNote" ADD CONSTRAINT "TradeNote_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeNote" ADD CONSTRAINT "TradeNote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "MarketOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeNote" ADD CONSTRAINT "TradeNote_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
