"use client";

import { useState, type ReactNode } from "react";

export function AdminTabs({
  marketsTab,
  playersTab,
}: {
  marketsTab: ReactNode;
  playersTab: ReactNode;
}) {
  const [tab, setTab] = useState<"markets" | "players">("markets");

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("markets")}
          className={`flex-1 rounded-lg border py-2 text-sm font-bold ${
            tab === "markets"
              ? "border-accent bg-accent text-white"
              : "border-felt-600 text-neutral-400"
          }`}
        >
          Markeder
        </button>
        <button
          type="button"
          onClick={() => setTab("players")}
          className={`flex-1 rounded-lg border py-2 text-sm font-bold ${
            tab === "players"
              ? "border-accent bg-accent text-white"
              : "border-felt-600 text-neutral-400"
          }`}
        >
          Spillere
        </button>
      </div>

      <div className={tab === "markets" ? "space-y-6" : "hidden"}>{marketsTab}</div>
      <div className={tab === "players" ? "space-y-6" : "hidden"}>{playersTab}</div>
    </div>
  );
}
