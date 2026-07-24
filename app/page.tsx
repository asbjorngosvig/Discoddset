import { requirePlayer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MarketStatus, BetStatus } from "@/lib/constants";
import { BalanceBar } from "@/components/BalanceBar";
import { MarketsClient } from "@/components/MarketsClient";
import { SettledMarkets } from "@/components/SettledMarkets";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function MarketsPage() {
  const player = await requirePlayer();

  const [openMarkets, settledMarkets, myBlocks] = await Promise.all([
    prisma.market.findMany({
      where: { status: MarketStatus.OPEN },
      include: {
        outcomes: { include: { bets: { where: { status: BetStatus.PENDING }, select: { stake: true } } } },
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.market.findMany({
      where: { status: MarketStatus.SETTLED },
      include: { outcomes: true },
      orderBy: { settledAt: "desc" },
      take: 5,
    }),
    prisma.marketBlock.findMany({ where: { playerId: player.id } }),
  ]);

  const blockedMarketIds = new Set(myBlocks.map((b) => b.marketId));

  const marketsForClient = openMarkets.map((m) => {
    const totalStaked = m.outcomes.reduce(
      (sum, o) => sum + o.bets.reduce((s, b) => s + b.stake, 0),
      0,
    );
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      closesAt: m.closesAt ? m.closesAt.toISOString() : null,
      categories: m.categories.map((mc) => ({ id: mc.category.id, name: mc.category.name })),
      day: m.day,
      blocked: blockedMarketIds.has(m.id),
      totalStaked,
      outcomes: m.outcomes.map((o) => ({ id: o.id, label: o.label, odds: o.odds })),
    };
  });

  const settledForClient = settledMarkets.map((m) => ({
    id: m.id,
    title: m.title,
    outcomes: m.outcomes.map((o) => ({ id: o.id, label: o.label, isWinner: o.isWinner })),
  }));

  return (
    <div>
      <AutoRefresh />
      <BalanceBar name={player.name} balance={player.balance} />
      <MarketsClient markets={marketsForClient} balance={player.balance} />
      <SettledMarkets markets={settledForClient} />
    </div>
  );
}
