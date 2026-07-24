-- CreateTable
CREATE TABLE "MarketCategory" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketCategory_marketId_categoryId_key" ON "MarketCategory"("marketId", "categoryId");

-- AddForeignKey
ALTER TABLE "MarketCategory" ADD CONSTRAINT "MarketCategory_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketCategory" ADD CONSTRAINT "MarketCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve existing single-category assignments before dropping the old column
INSERT INTO "MarketCategory" ("id", "marketId", "categoryId", "createdAt")
SELECT gen_random_uuid()::text, "id", "categoryId", CURRENT_TIMESTAMP
FROM "Market"
WHERE "categoryId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Market" DROP CONSTRAINT "Market_categoryId_fkey";

-- DropIndex
DROP INDEX "Market_categoryId_idx";

-- AlterTable
ALTER TABLE "Market" DROP COLUMN "categoryId";
