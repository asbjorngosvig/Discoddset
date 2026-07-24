"use client";

import { useState, useTransition } from "react";
import { adjustBalanceAction } from "@/app/admin/actions";
import { formatKr } from "@/lib/format";
import { Avatar } from "@/components/Avatar";

export function PlayerAdjustRow({
  player,
}: {
  player: { id: string; name: string; avatar: string; balance: number };
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const n = Number(amount);
    if (!Number.isInteger(n) || n === 0) {
      setError("Indtast et helt tal forskelligt fra nul.");
      return;
    }
    if (!reason.trim()) {
      setError("Tilføj en begrundelse.");
      return;
    }
    startTransition(async () => {
      const result = await adjustBalanceAction({ playerId: player.id, amount: n, reason });
      if (!result.ok) {
        setError(result.error);
      } else {
        setAmount("");
        setReason("");
      }
    });
  }

  return (
    <div className="rounded-lg border border-felt-700 bg-felt-900 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-neutral-200">
          <Avatar src={player.avatar} name={player.name} size={24} />
          {player.name}
        </span>
        <span className="font-display text-lg text-gold">{formatKr(player.balance)} kr</span>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          placeholder="±beløb"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-24 rounded-lg border border-felt-600 bg-felt-800 px-2 py-1.5 text-sm text-neutral-100 focus:border-accent focus:outline-none"
        />
        <input
          type="text"
          placeholder="Begrundelse (fx smadrede en stol)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-felt-600 bg-felt-800 px-2 py-1.5 text-sm text-neutral-100 focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={submit}
          className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-white disabled:opacity-50"
        >
          Udfør
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-accent-bright">{error}</p>}
    </div>
  );
}
