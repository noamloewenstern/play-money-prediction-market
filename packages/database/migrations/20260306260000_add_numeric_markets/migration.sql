-- AlterTable: Add numeric range market fields to Market
ALTER TABLE "Market" ADD COLUMN "numericMin" DOUBLE PRECISION,
ADD COLUMN "numericMax" DOUBLE PRECISION,
ADD COLUMN "numericUnit" TEXT,
ADD COLUMN "numericResolution" DOUBLE PRECISION;
