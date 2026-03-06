-- CreateEnum
CREATE TYPE "MarketVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Market" ADD COLUMN "visibility" "MarketVisibility" NOT NULL DEFAULT 'PUBLIC';
