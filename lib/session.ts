import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

export const PLAYER_COOKIE = "playerId";
export const ADMIN_COOKIE = "isAdmin";

export async function getCurrentPlayer() {
  const playerId = cookies().get(PLAYER_COOKIE)?.value;
  if (!playerId) return null;
  return prisma.player.findUnique({ where: { id: playerId } });
}

/** Use in server components for pages that require a selected player. */
export async function requirePlayer() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/select-player");
  return player;
}

export function isAdmin() {
  return cookies().get(ADMIN_COOKIE)?.value === "true";
}

/** Use at the top of admin server actions — nobody reaches these without the page's PIN gate, but guard anyway. */
export function requireAdmin() {
  if (!isAdmin()) {
    throw new Error("Admin-PIN kræves.");
  }
}
