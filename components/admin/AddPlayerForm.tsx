"use client";

import { useState, useTransition } from "react";
import { addPlayerAction } from "@/app/admin/actions";

export function AddPlayerForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addPlayerAction(formData);
      if (!result.ok) {
        setError(result.error);
      } else {
        setFormKey((k) => k + 1);
      }
    });
  }

  return (
    <form
      key={formKey}
      action={handleSubmit}
      className="rounded-xl border border-felt-700 bg-felt-900 p-4"
    >
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="Ny spillers navn"
          required
          className="min-w-0 flex-1 rounded-lg border border-felt-600 bg-felt-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50 active:bg-accent-dim"
        >
          {isPending ? "Tilføjer…" : "Tilføj spiller"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-accent-bright">{error}</p>}
    </form>
  );
}
