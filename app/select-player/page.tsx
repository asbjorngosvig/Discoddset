import { prisma } from "@/lib/prisma";
import { PlayerPicker } from "@/components/PlayerPicker";

export default async function SelectPlayerPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const allPlayers = await prisma.player.findMany({ orderBy: { name: "asc" } });

  // Stub and Bjørn always show last, in that order; everyone else stays alphabetical.
  const pinnedLast = ["Stub", "Bjørn"];
  const players = [
    ...allPlayers.filter((p) => !pinnedLast.includes(p.name)),
    ...pinnedLast
      .map((name) => allPlayers.find((p) => p.name === name))
      .filter((p): p is (typeof allPlayers)[number] => !!p),
  ];

  const next = searchParams.next ?? "/";

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <h1 className="mb-1 font-display text-5xl tracking-wide text-accent-bright text-center">
        Hvem oddser?
      </h1>


      {players.length === 0 ? (
        <p className="rounded-lg border border-felt-700 bg-felt-900 p-4 text-sm text-neutral-400">
          Ingen spillere endnu. Bed bookmakeren om at køre seed-scriptet.
        </p>
      ) : (
        <PlayerPicker players={players.map((p) => ({ id: p.id, name: p.name }))} next={next} />
      )}
    </div>
  );
}
