"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PLAYER_COOKIE, ADMIN_COOKIE, getCurrentPlayer } from "@/lib/session";
import { placeBet, BettingError } from "@/lib/betting";

export async function selectPlayerAction(formData: FormData) {
  const playerId = String(formData.get("playerId") ?? "");
  const next = String(formData.get("next") ?? "/");

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new Error("Den spiller findes ikke længere.");
  }

  cookies().set(PLAYER_COOKIE, player.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
  });

  redirect(next.startsWith("/") ? next : "/");
}

export async function adminLoginAction(formData: FormData) {
  const pin = String(formData.get("pin") ?? "");

  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) {
    redirect("/admin?error=1");
  }

  cookies().set(ADMIN_COOKIE, "true", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });

  redirect("/admin");
}

export async function placeBetAction(params: {
  outcomeId: string;
  stake: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const player = await getCurrentPlayer();
  if (!player) {
    return { ok: false, error: "Vælg dit navn først." };
  }

  try {
    await placeBet({ playerId: player.id, outcomeId: params.outcomeId, stake: params.stake });
  } catch (e) {
    if (e instanceof BettingError) {
      return { ok: false, error: e.message };
    }
    throw e;
  }

  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/leaderboard");
  return { ok: true };
}
