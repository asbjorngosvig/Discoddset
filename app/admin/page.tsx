import { isAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MarketStatus } from "@/lib/constants";
import { getMarketExposure } from "@/lib/betting";
import { PinForm } from "@/components/admin/PinForm";
import { CreateMarketForm } from "@/components/admin/CreateMarketForm";
import { MarketAdminCard } from "@/components/admin/MarketAdminCard";
import { PlayerAdjustRow } from "@/components/admin/PlayerAdjustRow";
import { AddPlayerForm } from "@/components/admin/AddPlayerForm";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  if (!isAdmin()) {
    return <PinForm hasError={searchParams.error === "1"} />;
  }

  const [activeMarkets, historyMarkets, players, categories, marketBlocks] = await Promise.all([
    prisma.market.findMany({
      where: { status: { in: [MarketStatus.OPEN, MarketStatus.CLOSED] } },
      include: { outcomes: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.market.findMany({
      where: { status: { in: [MarketStatus.SETTLED, MarketStatus.VOID] } },
      include: { outcomes: true },
      orderBy: { settledAt: "desc" },
      take: 10,
    }),
    prisma.player.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.marketBlock.findMany(),
  ]);

  const blockedByMarket = new Map<string, string[]>();
  for (const b of marketBlocks) {
    const list = blockedByMarket.get(b.marketId) ?? [];
    list.push(b.playerId);
    blockedByMarket.set(b.marketId, list);
  }

  const marketsForClient = await Promise.all(
    activeMarkets.map(async (market) => {
      const exposure = await getMarketExposure(market.id);
      const hasBets = exposure.some((o) => o.totalStaked > 0);
      return {
        id: market.id,
        title: market.title,
        description: market.description,
        status: market.status as "OPEN" | "CLOSED",
        closesAt: market.closesAt ? market.closesAt.toISOString() : null,
        categoryId: market.categoryId,
        hasBets,
        outcomes: market.outcomes.map((o) => {
          const exp = exposure.find((e) => e.outcomeId === o.id)!;
          return {
            id: o.id,
            label: o.label,
            odds: o.odds,
            totalStaked: exp.totalStaked,
            potentialPayout: exp.potentialPayout,
          };
        }),
      };
    }),
  );

  const historyForClient = historyMarkets.map((m) => ({
    id: m.id,
    title: m.title,
    status: m.status,
    outcomes: m.outcomes.map((o) => ({ id: o.id, label: o.label, isWinner: o.isWinner })),
  }));

  return (
    <div className="space-y-6 p-4 pb-24 pt-8">
      <h1 className="font-display text-4xl tracking-wide text-accent-bright text-center">Stub og Bjørn ONLY</h1>

      <CreateMarketForm categories={categories} />

      <section>
        <h2 className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Kategorier</h2>
        {categories.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li
                key={c.id}
                className="rounded-full border border-felt-600 px-3 py-1 text-xs text-neutral-300"
              >
                {c.name}
              </li>
            ))}
          </ul>
        )}
        <CategoryForm />
      </section>

      <section>
        <h2 className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Aktive markeder</h2>
        {marketsForClient.length === 0 ? (
          <p className="text-sm text-neutral-500">Ingen åbne eller lukkede markeder.</p>
        ) : (
          <div className="space-y-3">
            {marketsForClient.map((m) => (
              <MarketAdminCard
                key={m.id}
                market={m}
                categories={categories}
                players={players.map((p) => ({ id: p.id, name: p.name }))}
                blockedPlayerIds={blockedByMarket.get(m.id) ?? []}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Spillere</h2>
        <div className="space-y-2">
          {players.map((p) => (
            <PlayerAdjustRow
              key={p.id}
              player={{ id: p.id, name: p.name, balance: p.balance }}
            />
          ))}
        </div>
        <div className="mt-2">
          <AddPlayerForm />
        </div>
      </section>

      {historyForClient.length > 0 && (
        <details className="rounded-xl border border-felt-700 bg-felt-900 p-4">
          <summary className="cursor-pointer font-display text-xl tracking-wide text-neutral-300">
            Historik
          </summary>
          <ul className="mt-3 space-y-2">
            {historyForClient.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">{m.title}</span>
                <span className="font-semibold text-gold">
                  {m.status === MarketStatus.VOID
                    ? "Annulleret"
                    : (m.outcomes.find((o) => o.isWinner)?.label ?? "—")}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
