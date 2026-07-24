import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { BetStatus, BalanceTxnType, MarketStatus } from "./constants";

/** Thrown for any rule violation — callers (server actions) turn this into a user-facing message. */
export class BettingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BettingError";
  }
}

/** Odds are floats, balances are whole kroner — round at the point money changes hands. */
function calcPayout(stake: number, odds: number): number {
  return Math.round(stake * odds);
}

// ---------------------------------------------------------------------------
// Placing a bet
// ---------------------------------------------------------------------------

export async function placeBet(params: {
  playerId: string;
  outcomeId: string;
  stake: number;
}) {
  const { playerId, outcomeId, stake } = params;

  if (!Number.isInteger(stake) || stake <= 0) {
    throw new BettingError("Indsatsen skal være et positivt helt tal.");
  }

  return prisma.$transaction(async (tx) => {
    const outcome = await tx.outcome.findUnique({
      where: { id: outcomeId },
      include: { market: true },
    });
    if (!outcome) throw new BettingError("Udfaldet blev ikke fundet.");

    if (outcome.market.status !== MarketStatus.OPEN) {
      throw new BettingError("Dette marked er ikke åbent for væddemål.");
    }
    if (outcome.market.closesAt && outcome.market.closesAt.getTime() <= Date.now()) {
      throw new BettingError("Dette marked er lukket.");
    }

    // Re-read the player inside the transaction: two bets fired back-to-back
    // from the same phone (double tap) must not both pass the balance check
    // against a stale balance read from before either debit.
    const player = await tx.player.findUnique({ where: { id: playerId } });
    if (!player) throw new BettingError("Spilleren blev ikke fundet.");
    if (stake > player.balance) {
      throw new BettingError("Indsatsen overstiger din nuværende saldo.");
    }

    const newBalance = player.balance - stake;

    const bet = await tx.bet.create({
      data: {
        playerId,
        outcomeId,
        stake,
        oddsAtPlacement: outcome.odds,
        status: BetStatus.PENDING,
      },
    });

    await tx.player.update({
      where: { id: playerId },
      data: { balance: newBalance },
    });

    await tx.balanceTransaction.create({
      data: {
        playerId,
        type: BalanceTxnType.BET_PLACED,
        amount: -stake,
        balanceAfter: newBalance,
        betId: bet.id,
      },
    });

    return bet;
  });
}

// ---------------------------------------------------------------------------
// Market lifecycle
// ---------------------------------------------------------------------------

export async function closeMarket(marketId: string) {
  const result = await prisma.market.updateMany({
    where: { id: marketId, status: MarketStatus.OPEN },
    data: { status: MarketStatus.CLOSED },
  });
  if (result.count === 0) {
    throw new BettingError("Kun et åbent marked kan lukkes.");
  }
}

export async function settleMarket(params: {
  marketId: string;
  winningOutcomeId: string;
}) {
  const { marketId, winningOutcomeId } = params;

  return prisma.$transaction(async (tx) => {
    // Idempotency guard: this conditional update is the only thing allowed
    // to move a market to SETTLED. A retried or double-clicked settle call
    // sees count === 0 and bails before touching any bet or balance —
    // settling twice can never double-pay.
    const claim = await tx.market.updateMany({
      where: { id: marketId, status: { in: [MarketStatus.OPEN, MarketStatus.CLOSED] } },
      data: { status: MarketStatus.SETTLED, settledAt: new Date() },
    });
    if (claim.count === 0) {
      throw new BettingError("Markedet er allerede afgjort eller annulleret.");
    }

    const winningOutcome = await tx.outcome.findFirst({
      where: { id: winningOutcomeId, marketId },
    });
    if (!winningOutcome) {
      throw new BettingError("Det udfald hører ikke til dette marked.");
    }

    await tx.outcome.update({
      where: { id: winningOutcomeId },
      data: { isWinner: true },
    });

    const bets = await tx.bet.findMany({
      where: { outcome: { marketId }, status: BetStatus.PENDING },
    });

    for (const bet of bets) {
      const won = bet.outcomeId === winningOutcomeId;
      const payout = won ? calcPayout(bet.stake, bet.oddsAtPlacement) : 0;

      await tx.bet.update({
        where: { id: bet.id },
        data: { status: won ? BetStatus.WON : BetStatus.LOST, payout },
      });

      if (won && payout > 0) {
        const player = await tx.player.update({
          where: { id: bet.playerId },
          data: { balance: { increment: payout } },
        });

        await tx.balanceTransaction.create({
          data: {
            playerId: bet.playerId,
            type: BalanceTxnType.BET_PAYOUT,
            amount: payout,
            balanceAfter: player.balance,
            betId: bet.id,
          },
        });
      }
    }
  });
}

export async function voidMarket(marketId: string) {
  return prisma.$transaction(async (tx) => {
    // Same idempotency pattern as settleMarket.
    const claim = await tx.market.updateMany({
      where: { id: marketId, status: { in: [MarketStatus.OPEN, MarketStatus.CLOSED] } },
      data: { status: MarketStatus.VOID },
    });
    if (claim.count === 0) {
      throw new BettingError("Markedet er allerede afgjort eller annulleret.");
    }

    const bets = await tx.bet.findMany({
      where: { outcome: { marketId }, status: BetStatus.PENDING },
    });

    for (const bet of bets) {
      const player = await tx.player.update({
        where: { id: bet.playerId },
        data: { balance: { increment: bet.stake } },
      });

      await tx.bet.update({
        where: { id: bet.id },
        data: { status: BetStatus.REFUNDED, payout: bet.stake },
      });

      await tx.balanceTransaction.create({
        data: {
          playerId: bet.playerId,
          type: BalanceTxnType.BET_REFUND,
          amount: bet.stake,
          balanceAfter: player.balance,
          betId: bet.id,
        },
      });
    }
  });
}

export async function editOutcomeOdds(params: { outcomeId: string; odds: number }) {
  const { outcomeId, odds } = params;
  if (!Number.isFinite(odds) || odds <= 1) {
    throw new BettingError("Odds skal være et tal større end 1.");
  }

  return prisma.$transaction(async (tx) => {
    const outcome = await tx.outcome.findUnique({
      where: { id: outcomeId },
      include: { market: true },
    });
    if (!outcome) throw new BettingError("Udfaldet blev ikke fundet.");
    if (outcome.market.status !== MarketStatus.OPEN) {
      throw new BettingError("Odds kan kun ændres, mens markedet er åbent.");
    }

    // Checked across the whole market, not just this outcome: once money is
    // down on any outcome, changing another outcome's odds still changes the
    // payout landscape for people who already committed.
    const betCount = await tx.bet.count({
      where: { outcome: { marketId: outcome.marketId } },
    });
    if (betCount > 0) {
      throw new BettingError("Odds kan ikke ændres, når der er væddet på markedet.");
    }

    return tx.outcome.update({ where: { id: outcomeId }, data: { odds } });
  });
}

// ---------------------------------------------------------------------------
// Editing a market after creation
// ---------------------------------------------------------------------------

export async function updateMarket(params: {
  marketId: string;
  title: string;
  description: string | null;
  categoryId: string | null;
}) {
  const { marketId, title, description, categoryId } = params;
  if (!title.trim()) {
    throw new BettingError("Markedet skal have en titel.");
  }

  return prisma.$transaction(async (tx) => {
    const market = await tx.market.findUnique({ where: { id: marketId } });
    if (!market) throw new BettingError("Markedet blev ikke fundet.");
    if (market.status === MarketStatus.SETTLED || market.status === MarketStatus.VOID) {
      throw new BettingError("Afgjorte eller annullerede markeder kan ikke redigeres.");
    }

    return tx.market.update({
      where: { id: marketId },
      data: { title: title.trim(), description, categoryId },
    });
  });
}

export async function addOutcome(params: { marketId: string; label: string; odds: number }) {
  const { marketId, label, odds } = params;
  if (!label.trim()) throw new BettingError("Udfaldet skal have et navn.");
  if (!Number.isFinite(odds) || odds <= 1) {
    throw new BettingError("Odds skal være et tal større end 1.");
  }

  return prisma.$transaction(async (tx) => {
    const market = await tx.market.findUnique({ where: { id: marketId } });
    if (!market) throw new BettingError("Markedet blev ikke fundet.");
    if (market.status !== MarketStatus.OPEN) {
      throw new BettingError("Der kan kun tilføjes udfald til åbne markeder.");
    }

    return tx.outcome.create({ data: { marketId, label: label.trim(), odds } });
  });
}

export async function renameOutcome(params: { outcomeId: string; label: string }) {
  const { outcomeId, label } = params;
  if (!label.trim()) throw new BettingError("Udfaldet skal have et navn.");

  return prisma.$transaction(async (tx) => {
    const outcome = await tx.outcome.findUnique({
      where: { id: outcomeId },
      include: { market: true },
    });
    if (!outcome) throw new BettingError("Udfaldet blev ikke fundet.");
    if (outcome.market.status !== MarketStatus.OPEN) {
      throw new BettingError("Der kan kun omdøbes udfald på åbne markeder.");
    }

    // Only blocked if THIS outcome has bets — unlike odds, renaming an
    // outcome nobody has bet on yet doesn't change anyone else's exposure.
    const betCount = await tx.bet.count({ where: { outcomeId } });
    if (betCount > 0) {
      throw new BettingError("Der kan ikke omdøbes et udfald, som allerede har væddemål.");
    }

    return tx.outcome.update({ where: { id: outcomeId }, data: { label: label.trim() } });
  });
}

export async function removeOutcome(outcomeId: string) {
  return prisma.$transaction(async (tx) => {
    const outcome = await tx.outcome.findUnique({
      where: { id: outcomeId },
      include: { market: { include: { outcomes: true } } },
    });
    if (!outcome) throw new BettingError("Udfaldet blev ikke fundet.");
    if (outcome.market.status !== MarketStatus.OPEN) {
      throw new BettingError("Der kan kun fjernes udfald fra åbne markeder.");
    }
    if (outcome.market.outcomes.length <= 2) {
      throw new BettingError("Et marked skal have mindst to udfald.");
    }

    const betCount = await tx.bet.count({ where: { outcomeId } });
    if (betCount > 0) {
      throw new BettingError("Der kan ikke fjernes et udfald, som allerede har væddemål.");
    }

    await tx.outcome.delete({ where: { id: outcomeId } });
  });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function createCategory(name: string) {
  if (!name.trim()) throw new BettingError("Kategorien skal have et navn.");

  const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
  if (existing) {
    throw new BettingError("Der findes allerede en kategori med det navn.");
  }

  return prisma.category.create({ data: { name: name.trim() } });
}

// ---------------------------------------------------------------------------
// Admin balance adjustments (fines / bonuses)
// ---------------------------------------------------------------------------

export async function adjustPlayerBalance(params: {
  playerId: string;
  amount: number;
  reason: string;
}) {
  const { playerId, amount, reason } = params;
  if (!Number.isInteger(amount) || amount === 0) {
    throw new BettingError("Beløbet skal være et helt tal forskelligt fra nul.");
  }
  if (!reason.trim()) {
    throw new BettingError("Der skal angives en begrundelse ved justering af saldo.");
  }

  return prisma.$transaction(async (tx) => {
    const player = await tx.player.update({
      where: { id: playerId },
      data: { balance: { increment: amount } },
    });

    await tx.balanceTransaction.create({
      data: {
        playerId,
        type: BalanceTxnType.ADMIN_ADJUSTMENT,
        amount,
        balanceAfter: player.balance,
        reason,
      },
    });

    return player;
  });
}

// ---------------------------------------------------------------------------
// Admin exposure view — "what would I owe if this outcome wins?"
// ---------------------------------------------------------------------------

export async function getMarketExposure(marketId: string) {
  const outcomes = await prisma.outcome.findMany({
    where: { marketId },
    include: {
      bets: { where: { status: BetStatus.PENDING } },
    },
  });

  return outcomes.map((outcome) => {
    const totalStaked = outcome.bets.reduce((sum, bet) => sum + bet.stake, 0);
    const potentialPayout = outcome.bets.reduce(
      (sum, bet) => sum + calcPayout(bet.stake, bet.oddsAtPlacement),
      0,
    );
    return {
      outcomeId: outcome.id,
      label: outcome.label,
      odds: outcome.odds,
      totalStaked,
      potentialPayout,
    };
  });
}

export type { Prisma };
