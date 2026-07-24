export type SettledMarket = {
  id: string;
  title: string;
  outcomes: { id: string; label: string; isWinner: boolean }[];
};

export function SettledMarkets({ markets }: { markets: SettledMarket[] }) {
  if (markets.length === 0) return null;

  return (
    <details className="mx-4 mb-4 rounded-xl border border-felt-700 bg-felt-900 p-4">
      <summary className="cursor-pointer font-display text-xl tracking-wide text-neutral-300">
        Senest afgjort
      </summary>
      <ul className="mt-3 space-y-2">
        {markets.map((market) => {
          const winner = market.outcomes.find((o) => o.isWinner);
          return (
            <li key={market.id} className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">{market.title}</span>
              <span className="font-semibold text-gold">{winner?.label ?? "Annulleret"}</span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
