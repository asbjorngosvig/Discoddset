import { prisma } from "../lib/prisma";

// Launch-state reset: wipes all markets/bets/history and (re)creates just the
// player roster at the standard starting balance. No demo markets — the
// bookmaker creates real ones from /admin once the trip starts.
async function main() {
  console.log("Clearing existing data...");
  await prisma.balanceTransaction.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.market.deleteMany();
  await prisma.player.deleteMany();

  console.log("Creating players...");
  const playerNames = ["Karl", "Klose", "klå", "Thom", "Lyng", "Zak"];
  for (const name of playerNames) {
    await prisma.player.create({ data: { name } });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
