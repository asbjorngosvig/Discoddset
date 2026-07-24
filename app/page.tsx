import { requirePlayer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MarketStatus } from "@/lib/constants";
import { BalanceBar } from "@/components/BalanceBar";
import { MarketsClient } from "@/components/MarketsClient";
import { SettledMarkets } from "@/components/SettledMarkets";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function MarketsPage() {
  const player = await requirePlayer();

  const [openMarkets, settledMarkets] = await Promise.all([
    prisma.market.findMany({
      where: { status: MarketStatus.OPEN },
      include: { outcomes: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.market.findMany({
      where: { status: MarketStatus.SETTLED },
      include: { outcomes: true },
      orderBy: { settledAt: "desc" },
      take: 5,
    }),
  ]);

  const marketsForClient = openMarkets.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    closesAt: m.closesAt ? m.closesAt.toISOString() : null,
    category: m.category ? { id: m.category.id, name: m.category.name } : null,
    outcomes: m.outcomes.map((o) => ({ id: o.id, label: o.label, odds: o.odds })),
  }));

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
