import { prisma } from "@/lib/prisma";
import { requirePlayer } from "@/lib/session";
import { BetStatus, STARTING_BALANCE } from "@/lib/constants";
import { formatKr } from "@/lib/format";
import { Avatar } from "@/components/Avatar";

export default async function LeaderboardPage() {
  await requirePlayer();

  const players = await prisma.player.findMany({
    include: { bets: true },
    orderBy: { balance: "desc" },
  });

  const rows = players.map((p) => {
    const won = p.bets.filter((b) => b.status === BetStatus.WON);
    const lost = p.bets.filter((b) => b.status === BetStatus.LOST);
    const biggestWin = won.reduce((max, b) => Math.max(max, b.payout ?? 0), 0);
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      balance: p.balance,
      netProfit: p.balance - STARTING_BALANCE,
      wins: won.length,
      losses: lost.length,
      biggestWin,
    };
  });

  return (
    <div className="p-4 pt-8">
      <h1 className="mb-4 font-display text-4xl tracking-wide text-neutral-100">Rangliste</h1>
      <ul className="space-y-2">
        {rows.map((row, i) => {
          const isTop = i === 0;
          const isBottom = i === rows.length - 1 && rows.length > 1;
          return (
            <li
              key={row.id}
              className={`rounded-xl border p-3 ${
                isTop ? "border-gold bg-felt-900" : "border-felt-700 bg-felt-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center text-sm text-neutral-500">{i + 1}</span>
                  <Avatar src={row.avatar} name={row.name} size={32} />
                  <span className="font-semibold text-neutral-100">{row.name}</span>
                  {isTop && <span className="text-lg">👑</span>}
                  {isBottom && <span className="text-lg">🥄</span>}
                </div>
                <span className="font-display text-2xl text-gold">
                  {formatKr(row.balance)} kr
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between pl-7 text-xs text-neutral-500">
                <span className={row.netProfit >= 0 ? "text-win" : "text-accent-bright"}>
                  {row.netProfit >= 0 ? "+" : ""}
                  {formatKr(row.netProfit)} kr netto
                </span>
                <span>
                  {row.wins}V–{row.losses}T
                </span>
                <span>Bedste gevinst: {formatKr(row.biggestWin)} kr</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
