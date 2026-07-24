"use client";

import { useState, useTransition } from "react";
import {
  closeMarketAction,
  settleMarketAction,
  voidMarketAction,
  editOddsAction,
  updateMarketAction,
  addOutcomeAction,
  renameOutcomeAction,
  removeOutcomeAction,
  toggleMarketBlockAction,
} from "@/app/admin/actions";
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
  categoryId: string | null;
  outcomes: Outcome[];
};

export function MarketAdminCard({
  market,
  categories,
  players,
  blockedPlayerIds,
}: {
  market: Market;
  categories: { id: string; name: string }[];
  players: { id: string; name: string }[];
  blockedPlayerIds: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [settling, setSettling] = useState(false);
  const [winnerChoice, setWinnerChoice] = useState<string | null>(null);
  const [editingOutcomeId, setEditingOutcomeId] = useState<string | null>(null);
  const [oddsDraft, setOddsDraft] = useState("");

  const [editingMarket, setEditingMarket] = useState(false);
  const [titleDraft, setTitleDraft] = useState(market.title);
  const [descriptionDraft, setDescriptionDraft] = useState(market.description ?? "");
  const [categoryDraft, setCategoryDraft] = useState(market.categoryId ?? "");

  const [renamingOutcomeId, setRenamingOutcomeId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const [addingOutcome, setAddingOutcome] = useState(false);
  const [newOutcomeLabel, setNewOutcomeLabel] = useState("");
  const [newOutcomeOdds, setNewOutcomeOdds] = useState("");

  const [showBlocklist, setShowBlocklist] = useState(false);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set(blockedPlayerIds));

  function toggleBlock(playerId: string, blocked: boolean) {
    setError(null);
    setBlockedIds((prev) => {
      const next = new Set(prev);
      if (blocked) next.add(playerId);
      else next.delete(playerId);
      return next;
    });
    startTransition(async () => {
      const result = await toggleMarketBlockAction({ marketId: market.id, playerId, blocked });
      if (!result.ok) {
        setError(result.error);
        setBlockedIds((prev) => {
          const next = new Set(prev);
          if (blocked) next.delete(playerId);
          else next.add(playerId);
          return next;
        });
      }
    });
  }

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
  const structureEditable = market.status === "OPEN";

  return (
    <div className="rounded-xl border border-felt-700 bg-felt-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {editingMarket ? (
            <div className="space-y-2">
              <input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                className="w-full rounded-lg border border-felt-600 bg-felt-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent focus:outline-none"
              />
              <textarea
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                rows={2}
                placeholder="Beskrivelse (valgfri)"
                className="w-full rounded-lg border border-felt-600 bg-felt-800 px-3 py-2 text-sm text-neutral-100 focus:border-accent focus:outline-none"
              />
              {categories.length > 0 && (
                <select
                  value={categoryDraft}
                  onChange={(e) => setCategoryDraft(e.target.value)}
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
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-felt-600 py-1.5 text-xs text-neutral-300"
                  onClick={() => {
                    setEditingMarket(false);
                    setTitleDraft(market.title);
                    setDescriptionDraft(market.description ?? "");
                    setCategoryDraft(market.categoryId ?? "");
                  }}
                >
                  Annuller
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-accent py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  onClick={() =>
                    run(
                      () =>
                        updateMarketAction({
                          marketId: market.id,
                          title: titleDraft,
                          description: descriptionDraft,
                          categoryId: categoryDraft,
                        }),
                      () => setEditingMarket(false),
                    )
                  }
                >
                  Gem
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-display text-2xl leading-tight text-neutral-100">{market.title}</h3>
              {market.description && <p className="text-sm text-neutral-400">{market.description}</p>}
            </>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full border border-felt-600 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-400">
            {market.status === "OPEN" ? "ÅBEN" : "LUKKET"}
          </span>
          {!editingMarket && (
            <button
              type="button"
              className="text-[11px] text-accent-bright"
              onClick={() => setEditingMarket(true)}
            >
              Rediger
            </button>
          )}
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {market.outcomes.map((outcome) => {
          const outcomeEditable = structureEditable && outcome.totalStaked === 0;
          return (
            <li key={outcome.id} className="rounded-lg bg-felt-800 p-2">
              <div className="flex items-center justify-between gap-2">
                {renamingOutcomeId === outcome.id ? (
                  <input
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    className="min-w-0 flex-1 rounded border border-felt-600 bg-felt-900 px-1 py-0.5 text-sm text-neutral-100"
                  />
                ) : (
                  <button
                    type="button"
                    disabled={!outcomeEditable}
                    onClick={() => {
                      setRenamingOutcomeId(outcome.id);
                      setRenameDraft(outcome.label);
                    }}
                    title={outcomeEditable ? "Tryk for at omdøbe" : "Kan ikke omdøbes"}
                    className="min-w-0 flex-1 truncate text-left text-sm text-neutral-200 disabled:text-neutral-400"
                  >
                    {outcome.label}
                  </button>
                )}

                {editingOutcomeId === outcome.id ? (
                  <div className="flex shrink-0 items-center gap-2">
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
                ) : renamingOutcomeId === outcome.id ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-win"
                      onClick={() =>
                        run(
                          () => renameOutcomeAction({ outcomeId: outcome.id, label: renameDraft }),
                          () => setRenamingOutcomeId(null),
                        )
                      }
                    >
                      Gem
                    </button>
                    <button
                      type="button"
                      className="text-xs text-neutral-500"
                      onClick={() => setRenamingOutcomeId(null)}
                    >
                      Annuller
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
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
                    {outcomeEditable && market.outcomes.length > 2 && (
                      <button
                        type="button"
                        title="Fjern udfald"
                        className="text-xs text-accent-bright"
                        onClick={() => run(() => removeOutcomeAction(outcome.id))}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-neutral-500">
                <span>Væddet: {formatKr(outcome.totalStaked)} kr</span>
                <span>Skylder ved sejr: {formatKr(outcome.potentialPayout)} kr</span>
              </div>
            </li>
          );
        })}
      </ul>

      {structureEditable &&
        (addingOutcome ? (
          <div className="mt-2 flex gap-2">
            <input
              value={newOutcomeLabel}
              onChange={(e) => setNewOutcomeLabel(e.target.value)}
              placeholder="Navn"
              className="min-w-0 flex-1 rounded-lg border border-felt-600 bg-felt-800 px-2 py-1.5 text-sm text-neutral-100"
            />
            <input
              type="number"
              step="0.01"
              value={newOutcomeOdds}
              onChange={(e) => setNewOutcomeOdds(e.target.value)}
              placeholder="Odds"
              className="w-20 rounded-lg border border-felt-600 bg-felt-800 px-2 py-1.5 text-sm text-neutral-100"
            />
            <button
              type="button"
              disabled={isPending}
              className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              onClick={() =>
                run(
                  () =>
                    addOutcomeAction({
                      marketId: market.id,
                      label: newOutcomeLabel,
                      odds: Number(newOutcomeOdds),
                    }),
                  () => {
                    setAddingOutcome(false);
                    setNewOutcomeLabel("");
                    setNewOutcomeOdds("");
                  },
                )
              }
            >
              Tilføj
            </button>
            <button
              type="button"
              className="shrink-0 text-xs text-neutral-500"
              onClick={() => setAddingOutcome(false)}
            >
              Annuller
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="mt-2 text-xs text-accent-bright"
            onClick={() => setAddingOutcome(true)}
          >
            + Tilføj udfald
          </button>
        ))}

      <div className="mt-3">
        <button
          type="button"
          className="text-xs text-accent-bright"
          onClick={() => setShowBlocklist((s) => !s)}
        >
          {showBlocklist
            ? "Skjul blokerede spillere"
            : `Blokerede spillere${blockedIds.size > 0 ? ` (${blockedIds.size})` : ""}`}
        </button>
        {showBlocklist && (
          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 rounded-lg bg-felt-800 p-2">
            {players.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={blockedIds.has(p.id)}
                  onChange={(e) => toggleBlock(p.id, e.target.checked)}
                />
                {p.name}
              </label>
            ))}
          </div>
        )}
      </div>

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
