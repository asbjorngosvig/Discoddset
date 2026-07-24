"use client";

import { useState } from "react";
import { BetSlip } from "@/components/BetSlip";

export type Outcome = { id: string; label: string; odds: number };
export type Market = {
  id: string;
  title: string;
  description: string | null;
  closesAt: string | null;
  outcomes: Outcome[];
};

export function MarketsClient({ markets, balance }: { markets: Market[]; balance: number }) {
  const [selected, setSelected] = useState<{ market: Market; outcome: Outcome } | null>(null);

  return (
    <>
      <div className="space-y-4 p-4">
        {markets.length === 0 && (
          <p className="rounded-xl border border-felt-700 bg-felt-900 p-4 text-center text-sm text-neutral-400">
            Ingen åbne markeder lige nu. Vent på, at bookmakeren finder på noget.
          </p>
        )}
        {markets.map((market) => (
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
      <h3 className="font-display text-2xl tracking-wide text-neutral-100">{market.title}</h3>
      {market.description && (
        <p className="mt-1 text-sm text-neutral-400">{market.description}</p>
      )}
      {market.closesAt && (
        <p className="mt-1 text-xs text-neutral-500">
          Lukker {new Date(market.closesAt).toLocaleString("da-DK")}
        </p>
      )}
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
    </div>
  );
}
