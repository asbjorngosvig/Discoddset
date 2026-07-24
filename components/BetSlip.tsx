"use client";

import { useMemo, useState, useTransition } from "react";
import { placeBetAction } from "@/app/actions";
import { formatKr } from "@/lib/format";

const CHIPS = [25, 50, 100];

export function BetSlip({
  market,
  outcome,
  balance,
  onClose,
}: {
  market: { id: string; title: string };
  outcome: { id: string; label: string; odds: number };
  balance: number;
  onClose: () => void;
}) {
  const [stake, setStake] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const payout = useMemo(() => Math.round(stake * outcome.odds), [stake, outcome.odds]);

  function addChip(amount: number) {
    setStake((s) => Math.min(balance, s + amount));
    setError(null);
  }

  function allIn() {
    setStake(balance);
    setError(null);
  }

  function handleStakeInput(value: string) {
    const n = Math.floor(Number(value));
    setStake(Number.isFinite(n) && n > 0 ? n : 0);
    setError(null);
  }

  function confirm() {
    if (stake <= 0) {
      setError("Indtast en indsats først.");
      return;
    }
    if (stake > balance) {
      setError("Det er mere, end du har på saldoen.");
      return;
    }
    startTransition(async () => {
      const result = await placeBetAction({ outcomeId: outcome.id, stake });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={onClose}>
      <div
        className="w-full rounded-t-2xl border-t border-felt-700 bg-felt-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-neutral-500">{market.title}</div>
            <div className="font-display text-3xl text-neutral-100">{outcome.label}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-neutral-500">Odds</div>
            <div className="font-display text-3xl text-gold">{outcome.odds.toFixed(2)}</div>
          </div>
        </div>

        <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
          Indsats
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={balance}
          value={stake || ""}
          onChange={(e) => handleStakeInput(e.target.value)}
          placeholder="0"
          className="w-full rounded-lg border border-felt-600 bg-felt-800 px-4 py-3 text-2xl font-semibold text-neutral-100 focus:border-accent focus:outline-none"
        />

        <div className="mt-3 flex gap-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => addChip(c)}
              className="tap-target flex-1 rounded-lg border border-felt-600 bg-felt-800 py-2 text-sm font-medium text-neutral-200 active:border-accent"
            >
              +{c}
            </button>
          ))}
          <button
            type="button"
            onClick={allIn}
            className="tap-target flex-1 rounded-lg border border-gold-dim bg-felt-800 py-2 text-sm font-medium text-gold active:border-gold"
          >
            Alt ind
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-felt-800 px-4 py-3">
          <span className="text-sm text-neutral-400">Mulig gevinst</span>
          <span className="font-display text-2xl text-win">{formatKr(payout)} kr</span>
        </div>

        <p className="mt-2 text-xs text-neutral-500">Saldo: {formatKr(balance)} kr</p>

        {error && <p className="mt-2 text-sm text-accent-bright">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="tap-target flex-1 rounded-lg border border-felt-600 py-3 text-sm font-medium text-neutral-300"
          >
            Annuller
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={isPending || stake <= 0}
            className="tap-target flex-1 rounded-lg bg-accent py-3 text-sm font-bold text-white disabled:opacity-50 active:bg-accent-dim"
          >
            {isPending ? "Placerer…" : "Bekræft væddemål"}
          </button>
        </div>
      </div>
    </div>
  );
}
