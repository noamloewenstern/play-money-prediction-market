-- AlterTable
ALTER TABLE "Market" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "featuredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Market_isFeatured_idx" ON "Market"("isFeatured");
