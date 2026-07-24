import { requirePlayer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { BetStatus } from "@/lib/constants";
import { formatKr } from "@/lib/format";
import { Sparkline } from "@/components/Sparkline";

export default async function MePage() {
  const player = await requirePlayer();

  const [bets, balanceTxns] = await Promise.all([
    prisma.bet.findMany({
      where: { playerId: player.id },
      include: { outcome: { include: { market: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.balanceTransaction.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const pending = bets.filter((b) => b.status === BetStatus.PENDING);
  const settled = bets.filter((b) => b.status !== BetStatus.PENDING);
  const sparklineValues = [1000, ...balanceTxns.map((t) => t.balanceAfter)];

  return (
    <div className="p-4 pt-8">
      <h1 className="font-display text-4xl tracking-wide text-neutral-100 text-center">{player.name}</h1>

      <section className="mt-6 rounded-xl border border-felt-700 bg-felt-900 p-4">
        <h2 className="text-xs uppercase tracking-wider text-neutral-500">Saldohistorik</h2>
        <div className="mt-2">
          <Sparkline values={sparklineValues} />
        </div>
        <div className="mt-1 text-right font-display text-2xl text-gold">
          {formatKr(player.balance)} kr
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Åbne væddemål</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-neutral-500">Ingen åbne væddemål.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((bet) => (
              <li key={bet.id} className="rounded-lg border border-felt-700 bg-felt-900 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-neutral-400">{bet.outcome.market.title}</div>
                    <div className="font-semibold text-neutral-100">{bet.outcome.label}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-neutral-500">
                      Indsats {formatKr(bet.stake)} kr @ {bet.oddsAtPlacement.toFixed(2)}
                    </div>
                    <div className="font-display text-xl text-gold">
                      {formatKr(Math.round(bet.stake * bet.oddsAtPlacement))} kr
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Afgjorte væddemål</h2>
        {settled.length === 0 ? (
          <p className="text-sm text-neutral-500">Ingen afgjorte væddemål endnu.</p>
        ) : (
          <ul className="space-y-2">
            {settled.map((bet) => (
              <li
                key={bet.id}
                className="flex items-center justify-between rounded-lg border border-felt-700 bg-felt-900 p-3"
              >
                <div>
                  <div className="text-sm text-neutral-400">{bet.outcome.market.title}</div>
                  <div className="font-semibold text-neutral-100">{bet.outcome.label}</div>
                </div>
                <ResultBadge status={bet.status} stake={bet.stake} payout={bet.payout} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ResultBadge({
  status,
  stake,
  payout,
}: {
  status: string;
  stake: number;
  payout: number | null;
}) {
  if (status === BetStatus.WON) {
    return <span className="font-display text-xl text-win">+{formatKr(payout ?? 0)} kr</span>;
  }
  if (status === BetStatus.LOST) {
    return <span className="font-display text-xl text-lose">-{formatKr(stake)} kr</span>;
  }
  if (status === BetStatus.REFUNDED) {
    return <span className="font-display text-xl text-neutral-400">Refunderet</span>;
  }
  return null;
}
