-- AlterTable
ALTER TABLE "User" ADD COLUMN "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "quietHoursStart" INTEGER,
ADD COLUMN "quietHoursEnd" INTEGER,
ADD COLUMN "doNotDisturb" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "QueuedNotification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actionUrl" TEXT NOT NULL,
    "marketId" TEXT,
    "marketOptionId" TEXT,
    "transactionId" TEXT,
    "listId" TEXT,
    "commentId" TEXT,
    "parentCommentId" TEXT,
    "commentReactionId" TEXT,
    "groupKey" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueuedNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QueuedNotification_recipientId_deliveredAt_idx" ON "QueuedNotification"("recipientId", "deliveredAt");

-- AddForeignKey
ALTER TABLE "QueuedNotification" ADD CONSTRAINT "QueuedNotification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
