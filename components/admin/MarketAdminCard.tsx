"use client";

import { useState, useTransition } from "react";
import { closeMarketAction, settleMarketAction, voidMarketAction, editOddsAction } from "@/app/admin/actions";
import { formatKr } from "@/lib/format";

type ActionResult = { ok: true } | { ok: false; error: string };

type Outcome = {
  id: string;
  label: string;
  odds: number;
  totalStaked: number;
  potentialPayout: number;
};

type Market = {
  id: string;
  title: string;
  description: string | null;
  status: "OPEN" | "CLOSED";
  closesAt: string | null;
  hasBets: boolean;
  outcomes: Outcome[];
};

export function MarketAdminCard({ market }: { market: Market }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [settling, setSettling] = useState(false);
  const [winnerChoice, setWinnerChoice] = useState<string | null>(null);
  const [editingOutcomeId, setEditingOutcomeId] = useState<string | null>(null);
  const [oddsDraft, setOddsDraft] = useState("");

  function run(action: () => Promise<ActionResult>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
      } else {
        onSuccess?.();
      }
    });
  }

  const oddsEditable = market.status === "OPEN" && !market.hasBets;

  return (
    <div className="rounded-xl border border-felt-700 bg-felt-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-2xl leading-tight text-neutral-100">{market.title}</h3>
          {market.description && <p className="text-sm text-neutral-400">{market.description}</p>}
        </div>
        <span className="shrink-0 rounded-full border border-felt-600 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-400">
          {market.status === "OPEN" ? "ÅBEN" : "LUKKET"}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {market.outcomes.map((outcome) => (
          <li key={outcome.id} className="rounded-lg bg-felt-800 p-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-200">{outcome.label}</span>
              {editingOutcomeId === outcome.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={oddsDraft}
                    onChange={(e) => setOddsDraft(e.target.value)}
                    className="w-16 rounded border border-felt-600 bg-felt-900 px-1 py-0.5 text-right text-sm text-neutral-100"
                  />
                  <button
                    type="button"
                    className="text-xs font-semibold text-win"
                    onClick={() =>
                      run(
                        () => editOddsAction({ outcomeId: outcome.id, odds: Number(oddsDraft) }),
                        () => setEditingOutcomeId(null),
                      )
                    }
                  >
                    Gem
                  </button>
                  <button
                    type="button"
                    className="text-xs text-neutral-500"
                    onClick={() => setEditingOutcomeId(null)}
                  >
                    Annuller
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!oddsEditable}
                  onClick={() => {
                    setEditingOutcomeId(outcome.id);
                    setOddsDraft(String(outcome.odds));
                  }}
                  title={oddsEditable ? "Tryk for at redigere" : "Odds låses, når markedet har væddemål"}
                  className="font-display text-lg text-gold disabled:text-neutral-500"
                >
                  {outcome.odds.toFixed(2)}
                </button>
              )}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-neutral-500">
              <span>Væddet: {formatKr(outcome.totalStaked)} kr</span>
              <span>Skylder ved sejr: {formatKr(outcome.potentialPayout)} kr</span>
            </div>
          </li>
        ))}
      </ul>

      {settling ? (
        <div className="mt-3 rounded-lg border border-gold-dim bg-felt-800 p-3">
          <p className="mb-2 text-xs uppercase tracking-wider text-neutral-400">Vælg vinderen</p>
          <div className="space-y-1">
            {market.outcomes.map((outcome) => (
              <label key={outcome.id} className="flex items-center gap-2 text-sm text-neutral-200">
                <input
                  type="radio"
                  name={`winner-${market.id}`}
                  checked={winnerChoice === outcome.id}
                  onChange={() => setWinnerChoice(outcome.id)}
                />
                {outcome.label}
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-lg border border-felt-600 py-2 text-sm text-neutral-300"
              onClick={() => setSettling(false)}
            >
              Annuller
            </button>
            <button
              type="button"
              disabled={!winnerChoice || isPending}
              className="flex-1 rounded-lg bg-accent py-2 text-sm font-bold text-white disabled:opacity-50"
              onClick={() =>
                run(
                  () => settleMarketAction({ marketId: market.id, winningOutcomeId: winnerChoice! }),
                  () => setSettling(false),
                )
              }
            >
              Bekræft afgørelse
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          {market.status === "OPEN" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => closeMarketAction(market.id))}
              className="flex-1 rounded-lg border border-felt-600 py-2 text-sm text-neutral-300 disabled:opacity-50"
            >
              Luk
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => setSettling(true)}
            className="flex-1 rounded-lg bg-accent py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Afgør
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => voidMarketAction(market.id))}
            className="flex-1 rounded-lg border border-felt-600 py-2 text-sm text-neutral-300 disabled:opacity-50"
          >
            Annuller marked
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-accent-bright">{error}</p>}
    </div>
  );
}
