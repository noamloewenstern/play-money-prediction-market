-- CreateEnum
CREATE TYPE "ResolutionDisputeStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'OVERRIDDEN', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'RESOLUTION_DISPUTE_FLAGGED';
ALTER TYPE "NotificationType" ADD VALUE 'RESOLUTION_DISPUTE_REVIEWED';

-- AlterEnum
ALTER TYPE "AuditLogAction" ADD VALUE 'RESOLUTION_DISPUTE_CREATE';
ALTER TYPE "AuditLogAction" ADD VALUE 'RESOLUTION_DISPUTE_REJECT';
ALTER TYPE "AuditLogAction" ADD VALUE 'RESOLUTION_DISPUTE_OVERRIDE';

-- CreateTable
CREATE TABLE "ResolutionDispute" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "marketResolutionId" TEXT NOT NULL,
    "flaggedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ResolutionDisputeStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResolutionDispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResolutionDispute_marketId_idx" ON "ResolutionDispute"("marketId");

-- CreateIndex
CREATE INDEX "ResolutionDispute_flaggedById_idx" ON "ResolutionDispute"("flaggedById");

-- CreateIndex
CREATE INDEX "ResolutionDispute_status_createdAt_idx" ON "ResolutionDispute"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ResolutionDispute" ADD CONSTRAINT "ResolutionDispute_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolutionDispute" ADD CONSTRAINT "ResolutionDispute_marketResolutionId_fkey" FOREIGN KEY ("marketResolutionId") REFERENCES "MarketResolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolutionDispute" ADD CONSTRAINT "ResolutionDispute_flaggedById_fkey" FOREIGN KEY ("flaggedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolutionDispute" ADD CONSTRAINT "ResolutionDispute_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
