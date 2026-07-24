"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import {
  closeMarket,
  settleMarket,
  voidMarket,
  editOutcomeOdds,
  adjustPlayerBalance,
  BettingError,
} from "@/lib/betting";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/leaderboard");
}

export async function createMarketAction(formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const labels = formData.getAll("outcomeLabel").map((v) => String(v).trim());
  const oddsRaw = formData.getAll("outcomeOdds").map((v) => String(v).trim());

  if (!title) return { ok: false, error: "Giv markedet en titel." };

  const outcomes = labels
    .map((label, i) => ({ label, odds: Number(oddsRaw[i]) }))
    .filter((o) => o.label.length > 0);

  if (outcomes.length < 2) {
    return { ok: false, error: "Tilføj mindst to udfald." };
  }
  if (outcomes.some((o) => !Number.isFinite(o.odds) || o.odds <= 1)) {
    return { ok: false, error: "Alle udfald skal have odds større end 1." };
  }

  await prisma.market.create({
    data: {
      title,
      description: description || null,
      outcomes: { create: outcomes },
    },
  });

  revalidateAll();
  return { ok: true };
}

export async function closeMarketAction(marketId: string): Promise<ActionResult> {
  requireAdmin();
  try {
    await closeMarket(marketId);
  } catch (e) {
    if (e instanceof BettingError) return { ok: false, error: e.message };
    throw e;
  }
  revalidateAll();
  return { ok: true };
}

export async function settleMarketAction(params: {
  marketId: string;
  winningOutcomeId: string;
}): Promise<ActionResult> {
  requireAdmin();
  try {
    await settleMarket(params);
  } catch (e) {
    if (e instanceof BettingError) return { ok: false, error: e.message };
    throw e;
  }
  revalidateAll();
  return { ok: true };
}

export async function voidMarketAction(marketId: string): Promise<ActionResult> {
  requireAdmin();
  try {
    await voidMarket(marketId);
  } catch (e) {
    if (e instanceof BettingError) return { ok: false, error: e.message };
    throw e;
  }
  revalidateAll();
  return { ok: true };
}

export async function editOddsAction(params: {
  outcomeId: string;
  odds: number;
}): Promise<ActionResult> {
  requireAdmin();
  try {
    await editOutcomeOdds(params);
  } catch (e) {
    if (e instanceof BettingError) return { ok: false, error: e.message };
    throw e;
  }
  revalidateAll();
  return { ok: true };
}

export async function addPlayerAction(formData: FormData): Promise<ActionResult> {
  requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Giv spilleren et navn." };

  const existing = await prisma.player.findUnique({ where: { name } });
  if (existing) return { ok: false, error: "Der findes allerede en spiller med det navn." };

  await prisma.player.create({
    data: { name, avatar: "/avatars/default.svg" },
  });

  revalidateAll();
  return { ok: true };
}

export async function adjustBalanceAction(params: {
  playerId: string;
  amount: number;
  reason: string;
}): Promise<ActionResult> {
  requireAdmin();
  try {
    await adjustPlayerBalance(params);
  } catch (e) {
    if (e instanceof BettingError) return { ok: false, error: e.message };
    throw e;
  }
  revalidateAll();
  return { ok: true };
}
