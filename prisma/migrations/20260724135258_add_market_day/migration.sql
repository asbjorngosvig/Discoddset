-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "day" TEXT NOT NULL DEFAULT 'Hele turen';

-- CreateIndex
CREATE INDEX "Market_day_idx" ON "Market"("day");
