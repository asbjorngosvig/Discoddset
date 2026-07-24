// App-level stand-ins for enums, since SQLite columns storing them are plain
// strings (see prisma/schema.prisma). Always read/write statuses through
// these objects rather than string literals.

export const MarketStatus = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  SETTLED: "SETTLED",
  VOID: "VOID",
} as const;
export type MarketStatus = (typeof MarketStatus)[keyof typeof MarketStatus];

export const BetStatus = {
  PENDING: "PENDING",
  WON: "WON",
  LOST: "LOST",
  REFUNDED: "REFUNDED",
} as const;
export type BetStatus = (typeof BetStatus)[keyof typeof BetStatus];

export const BalanceTxnType = {
  BET_PLACED: "BET_PLACED",
  BET_PAYOUT: "BET_PAYOUT",
  BET_REFUND: "BET_REFUND",
  ADMIN_ADJUSTMENT: "ADMIN_ADJUSTMENT",
} as const;
export type BalanceTxnType = (typeof BalanceTxnType)[keyof typeof BalanceTxnType];

export const STARTING_BALANCE = 1000;

// Cookie names live here (not lib/session.ts) so middleware.ts — which runs
// in the Edge runtime — can read them without pulling in Prisma/the Neon
// driver through lib/session.ts's import chain.
export const PLAYER_COOKIE = "playerId";
export const ADMIN_COOKIE = "isAdmin";
