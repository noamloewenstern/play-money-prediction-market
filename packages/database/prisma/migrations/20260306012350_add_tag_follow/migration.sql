-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TAG_NEW_MARKET';

-- CreateTable
CREATE TABLE "TagFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TagFollow_tag_idx" ON "TagFollow"("tag");

-- CreateIndex
CREATE INDEX "TagFollow_userId_idx" ON "TagFollow"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TagFollow_userId_tag_key" ON "TagFollow"("userId", "tag");

-- AddForeignKey
ALTER TABLE "TagFollow" ADD CONSTRAINT "TagFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
