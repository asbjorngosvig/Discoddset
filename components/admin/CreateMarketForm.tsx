"use client";

import { useState, useTransition } from "react";
import { createMarketAction } from "@/app/admin/actions";

export function CreateMarketForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [outcomeCount, setOutcomeCount] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createMarketAction(formData);
      if (!result.ok) {
        setError(result.error);
      } else {
        setOutcomeCount(2);
        setFormKey((k) => k + 1);
      }
    });
  }

  return (
    <form
      key={formKey}
      action={handleSubmit}
      className="space-y-3 rounded-xl border border-felt-700 bg-felt-900 p-4"
    >
      <h3 className="font-display text-xl tracking-wide text-neutral-100">Nyt marked</h3>
      <input
        name="title"
        placeholder="Titel, fx Hvem falder i søen først?"
        required
        className="w-full rounded-lg border border-felt-600 bg-felt-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent focus:outline-none"
      />
      <textarea
        name="description"
        placeholder="Beskrivelse (valgfri)"
        rows={2}
        className="w-full rounded-lg border border-felt-600 bg-felt-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent focus:outline-none"
      />
      {categories.length > 0 && (
        <select
          name="categoryId"
          defaultValue=""
          className="w-full rounded-lg border border-felt-600 bg-felt-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent focus:outline-none"
        >
          <option value="">Ingen kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      <div className="space-y-2">
        {Array.from({ length: outcomeCount }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <input
              name="outcomeLabel"
              placeholder={`Udfald ${i + 1}`}
              className="flex-1 rounded-lg border border-felt-600 bg-felt-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent focus:outline-none"
            />
            <input
              name="outcomeOdds"
              type="number"
              step="0.01"
              placeholder="Odds"
              className="w-20 rounded-lg border border-felt-600 bg-felt-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent focus:outline-none"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOutcomeCount((c) => c + 1)}
        className="text-sm text-accent-bright"
      >
        + Tilføj udfald
      </button>

      {error && <p className="text-sm text-accent-bright">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-50 active:bg-accent-dim"
      >
        {isPending ? "Opretter…" : "Opret marked"}
      </button>
    </form>
  );
}
