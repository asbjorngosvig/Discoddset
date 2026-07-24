import { formatKr } from "@/lib/format";

export function BalanceBar({
  name,
  balance,
}: {
  name: string;
  balance: number;
}) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-felt-700 bg-felt-950/95 px-4 py-3 backdrop-blur">
      <span className="text-sm font-medium text-neutral-300">{name}</span>
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500">Saldo</div>
        <div className="font-display text-2xl leading-none text-gold">
          {formatKr(balance)} kr
        </div>
      </div>
    </div>
  );
}
