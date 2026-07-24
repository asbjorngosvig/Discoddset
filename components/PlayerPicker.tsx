"use client";

import { useState, useTransition } from "react";
import { selectPlayerAction } from "@/app/actions";

export function PlayerPicker({
  players,
  next,
}: {
  players: { id: string; name: string }[];
  next: string;
}) {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!selected) return;
    if (pin.length !== 3) {
      setError("Indtast din 3-cifrede kode.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await selectPlayerAction({ playerId: selected.id, pin, next });
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <p className="text-center font-display text-3xl tracking-wide text-neutral-100">
          {selected.name}
        </p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={3}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 3));
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Kode"
          autoFocus
          className="w-full rounded-lg border border-felt-600 bg-felt-800 px-4 py-3 text-center text-2xl tracking-widest text-neutral-100 focus:border-accent focus:outline-none"
        />
        {error && <p className="text-center text-sm text-accent-bright">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setPin("");
              setError(null);
            }}
            className="flex-1 rounded-lg border border-felt-600 py-3 text-sm text-neutral-300"
          >
            Tilbage
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={submit}
            className="flex-1 rounded-lg bg-accent py-3 text-sm font-bold text-white disabled:opacity-50 active:bg-accent-dim"
          >
            {isPending ? "Tjekker…" : "Bekræft"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {players.map((player) => (
        <button
          key={player.id}
          type="button"
          onClick={() => setSelected(player)}
          className="tap-target flex w-full items-center justify-center rounded-xl border border-felt-700 bg-felt-900 py-6 active:scale-95 active:border-accent"
        >
          <span className="font-display text-2xl tracking-wide text-neutral-100">
            {player.name}
          </span>
        </button>
      ))}
    </div>
  );
}
