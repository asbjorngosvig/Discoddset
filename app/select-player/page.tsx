import { prisma } from "@/lib/prisma";
import { selectPlayerAction } from "@/app/actions";
import { Avatar } from "@/components/Avatar";

export default async function SelectPlayerPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const players = await prisma.player.findMany({ orderBy: { name: "asc" } });
  const next = searchParams.next ?? "/";

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <h1 className="mb-1 font-display text-5xl tracking-wide text-accent-bright">
        Hvem oddser?
      </h1>
      <p className="mb-8 text-sm text-neutral-400">
        Vælg dit navn
      </p>

      {players.length === 0 ? (
        <p className="rounded-lg border border-felt-700 bg-felt-900 p-4 text-sm text-neutral-400">
          Ingen spillere endnu. Bed bookmakeren om at køre seed-scriptet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {players.map((player) => (
            <form key={player.id} action={selectPlayerAction}>
              <input type="hidden" name="playerId" value={player.id} />
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="tap-target flex w-full flex-col items-center gap-2 rounded-xl border border-felt-700 bg-felt-900 py-5 active:scale-95 active:border-accent"
              >
                <Avatar src={player.avatar} name={player.name} size={64} />
                <span className="text-base font-semibold text-neutral-100">{player.name}</span>
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
