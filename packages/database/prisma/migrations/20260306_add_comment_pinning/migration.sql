-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "pinnedAt" TIMESTAMP(3);

-- AlterEnum
ALTER TYPE "AuditLogAction" ADD VALUE 'COMMENT_PIN';
