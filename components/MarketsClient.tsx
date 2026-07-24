"use client";

import { useMemo, useState } from "react";
import { BetSlip } from "@/components/BetSlip";
import { formatKr } from "@/lib/format";
import { MARKET_DAYS } from "@/lib/constants";

export type Outcome = { id: string; label: string; odds: number };
export type Market = {
  id: string;
  title: string;
  description: string | null;
  closesAt: string | null;
  category: { id: string; name: string } | null;
  day: string;
  blocked: boolean;
  totalStaked: number;
  outcomes: Outcome[];
};

export function MarketsClient({ markets, balance }: { markets: Market[]; balance: number }) {
  const [selected, setSelected] = useState<{ market: Market; outcome: Outcome } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<string | null>(null);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of markets) {
      if (m.category) seen.set(m.category.id, m.category.name);
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [markets]);

  const visibleMarkets = markets.filter(
    (m) =>
      (categoryFilter === null || m.category?.id === categoryFilter) &&
      (dayFilter === null || m.day === dayFilter),
  );

  return (
    <>
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 pt-3">
        <button
          type="button"
          onClick={() => setDayFilter(null)}
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
            dayFilter === null ? "border-accent bg-accent text-white" : "border-felt-600 text-neutral-400"
          }`}
        >
          Alle dage
        </button>
        {MARKET_DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDayFilter(d)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
              dayFilter === d ? "border-accent bg-accent text-white" : "border-felt-600 text-neutral-400"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 pt-2">
          <button
            type="button"
            onClick={() => setCategoryFilter(null)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
              categoryFilter === null
                ? "border-accent bg-accent text-white"
                : "border-felt-600 text-neutral-400"
            }`}
          >
            Alle kategorier
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                categoryFilter === c.id
                  ? "border-accent bg-accent text-white"
                  : "border-felt-600 text-neutral-400"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4 p-4">
        {visibleMarkets.length === 0 && (
          <p className="rounded-xl border border-felt-700 bg-felt-900 p-4 text-center text-sm text-neutral-400">
            {markets.length === 0
              ? "Ingen åbne markeder lige nu. Vent på, at bookmakeren finder på noget."
              : "Ingen markeder matcher dit filter lige nu."}
          </p>
        )}
        {visibleMarkets.map((market) => (
          <MarketCard
            key={market.id}
            market={market}
            onPick={(outcome) => setSelected({ market, outcome })}
          />
        ))}
      </div>

      {selected && (
        <BetSlip
          market={selected.market}
          outcome={selected.outcome}
          balance={balance}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function MarketCard({
  market,
  onPick,
}: {
  market: Market;
  onPick: (outcome: Outcome) => void;
}) {
  return (
    <div className="rounded-xl border border-felt-700 bg-felt-900 p-4">
      <div className="mb-1 flex flex-wrap gap-1">
        <span className="inline-block rounded-full border border-felt-600 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-400">
          {market.day}
        </span>
        {market.category && (
          <span className="inline-block rounded-full border border-felt-600 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-400">
            {market.category.name}
          </span>
        )}
      </div>
      <h3 className="font-display text-2xl tracking-wide text-neutral-100">{market.title}</h3>
      {market.description && (
        <p className="mt-1 text-sm text-neutral-400">{market.description}</p>
      )}
      {market.closesAt && (
        <p className="mt-1 text-xs text-neutral-500">
          Lukker {new Date(market.closesAt).toLocaleString("da-DK")}
        </p>
      )}
      <p className="mt-1 text-xs text-neutral-500">
        Satset i alt: {formatKr(market.totalStaked)} kr
      </p>
      {market.blocked ? (
        <p className="mt-3 rounded-lg border border-felt-600 bg-felt-800 p-3 text-center text-sm text-neutral-500">
          Du er blokeret fra at vædde på dette marked.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {market.outcomes.map((outcome) => (
            <button
              key={outcome.id}
              type="button"
              onClick={() => onPick(outcome)}
              className="tap-target flex flex-col items-center rounded-lg border border-felt-600 bg-felt-800 py-3 active:scale-95 active:border-accent"
            >
              <span className="text-sm text-neutral-300">{outcome.label}</span>
              <span className="font-display text-3xl text-gold">{outcome.odds.toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
