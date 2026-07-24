"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PLAYER_COOKIE, ADMIN_COOKIE, getCurrentPlayer } from "@/lib/session";
import { placeBet, BettingError } from "@/lib/betting";
import { getPlayerPin } from "@/lib/playerPins";

export async function selectPlayerAction(params: {
  playerId: string;
  pin: string;
  next: string;
}): Promise<{ ok: false; error: string }> {
  const player = await prisma.player.findUnique({ where: { id: params.playerId } });
  if (!player) {
    return { ok: false, error: "Den spiller findes ikke længere." };
  }

  const expectedPin = getPlayerPin(player.name);
  if (!expectedPin || params.pin !== expectedPin) {
    return { ok: false, error: "Forkert kode." };
  }

  cookies().set(PLAYER_COOKIE, player.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
  });

  redirect(params.next.startsWith("/") ? params.next : "/");
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
