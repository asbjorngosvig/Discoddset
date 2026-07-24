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

// Fixed set of trip days a market can be tagged with — unlike categories,
// these aren't admin-creatable, they're the trip's actual schedule.
export const MARKET_DAYS = ["Dag 1", "Dag 2", "Dag 3", "Dag 4", "Dag 5", "Hele turen"] as const;
export type MarketDay = (typeof MARKET_DAYS)[number];
export const DEFAULT_MARKET_DAY: MarketDay = "Hele turen";

// Cookie names live here (not lib/session.ts) so middleware.ts — which runs
// in the Edge runtime — can read them without pulling in Prisma/the Neon
// driver through lib/session.ts's import chain.
export const PLAYER_COOKIE = "playerId";
export const ADMIN_COOKIE = "isAdmin";
