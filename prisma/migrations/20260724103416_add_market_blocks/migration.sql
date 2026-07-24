-- CreateTable
CREATE TABLE "MarketBlock" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketBlock_marketId_playerId_key" ON "MarketBlock"("marketId", "playerId");

-- AddForeignKey
ALTER TABLE "MarketBlock" ADD CONSTRAINT "MarketBlock_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketBlock" ADD CONSTRAINT "MarketBlock_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
