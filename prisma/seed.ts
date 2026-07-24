import { prisma } from "../lib/prisma";
import { placeBet, settleMarket, voidMarket, adjustPlayerBalance } from "../lib/betting";
import { MarketStatus } from "../lib/constants";

function outcome<M extends { outcomes: { id: string; label: string }[] }>(market: M, label: string) {
  const found = market.outcomes.find((o) => o.label === label);
  if (!found) throw new Error(`Seed error: outcome "${label}" not found`);
  return found;
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.balanceTransaction.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.market.deleteMany();
  await prisma.player.deleteMany();

  console.log("Creating players...");
  const playerDefs = [
    { name: "Karl", avatar: "/avatars/karl.svg" },
    { name: "Klose", avatar: "/avatars/klose.svg" },
    { name: "klå", avatar: "/avatars/kla.svg" },
    { name: "Thom", avatar: "/avatars/thom.svg" },
    { name: "William", avatar: "/avatars/william.svg" },
    { name: "Zak", avatar: "/avatars/zak.svg" },
  ];

  const players: Record<string, { id: string }> = {};
  for (const def of playerDefs) {
    players[def.name] = await prisma.player.create({ data: def });
  }

  console.log("Creating markets...");

  const lakeMarket = await prisma.market.create({
    data: {
      title: "Hvem falder i søen først?",
      description: "Fuldt påklædt, med eller uden vilje — først i vandet vinder.",
      status: MarketStatus.OPEN,
      outcomes: {
        create: [
          { label: "Karl", odds: 3.5 },
          { label: "Thom", odds: 2.0 },
          { label: "Zak", odds: 4.0 },
          { label: "En komplet overraskelse", odds: 5.0 },
        ],
      },
    },
    include: { outcomes: true },
  });

  const closesAt = new Date();
  closesAt.setHours(closesAt.getHours() + 6);

  const beerMarket = await prisma.market.create({
    data: {
      title: "Hvor mange øl før William begynder at synge?",
      closesAt,
      status: MarketStatus.OPEN,
      outcomes: {
        create: [
          { label: "0-5", odds: 2.5 },
          { label: "6-10", odds: 1.8 },
          { label: "11+", odds: 3.2 },
        ],
      },
    },
    include: { outcomes: true },
  });

  const rainMarket = await prisma.market.create({
    data: {
      title: "Regner det til bålaftenen?",
      status: MarketStatus.OPEN,
      outcomes: {
        create: [
          { label: "Ja", odds: 1.9 },
          { label: "Nej", odds: 1.9 },
        ],
      },
    },
    include: { outcomes: true },
  });

  const cornholeMarket = await prisma.market.create({
    data: {
      title: "Hvem vinder cornhole-turneringen?",
      status: MarketStatus.OPEN,
      outcomes: {
        create: [
          { label: "Karl & Thom", odds: 2.2 },
          { label: "Klose & Zak", odds: 2.5 },
          { label: "klå & William", odds: 3.1 },
          { label: "Overraskelsesholdet", odds: 2.8 },
        ],
      },
    },
    include: { outcomes: true },
  });

  const grillMarket = await prisma.market.create({
    data: {
      title: "Går grillen op i flammer?",
      status: MarketStatus.OPEN,
      outcomes: {
        create: [
          { label: "Ja", odds: 4.0 },
          { label: "Nej", odds: 1.2 },
        ],
      },
    },
    include: { outcomes: true },
  });

  console.log("Placing demo bets...");

  await placeBet({ playerId: players.William!.id, outcomeId: outcome(lakeMarket, "Karl").id, stake: 100 });
  await placeBet({ playerId: players["klå"]!.id, outcomeId: outcome(lakeMarket, "Thom").id, stake: 50 });
  await placeBet({
    playerId: players.Zak!.id,
    outcomeId: outcome(lakeMarket, "En komplet overraskelse").id,
    stake: 75,
  });

  await placeBet({ playerId: players.Klose!.id, outcomeId: outcome(beerMarket, "6-10").id, stake: 60 });
  await placeBet({ playerId: players.Karl!.id, outcomeId: outcome(beerMarket, "11+").id, stake: 40 });

  await placeBet({ playerId: players.Thom!.id, outcomeId: outcome(rainMarket, "Nej").id, stake: 120 });
  await placeBet({ playerId: players["klå"]!.id, outcomeId: outcome(rainMarket, "Ja").id, stake: 80 });

  await placeBet({
    playerId: players.William!.id,
    outcomeId: outcome(cornholeMarket, "Karl & Thom").id,
    stake: 100,
  });
  await placeBet({
    playerId: players.Zak!.id,
    outcomeId: outcome(cornholeMarket, "klå & William").id,
    stake: 90,
  });
  await placeBet({
    playerId: players.Karl!.id,
    outcomeId: outcome(cornholeMarket, "Klose & Zak").id,
    stake: 70,
  });

  await placeBet({ playerId: players.Klose!.id, outcomeId: outcome(grillMarket, "Nej").id, stake: 30 });
  await placeBet({ playerId: players.Thom!.id, outcomeId: outcome(grillMarket, "Ja").id, stake: 20 });

  console.log("Settling the cornhole tournament (Karl & Thom won)...");
  await settleMarket({
    marketId: cornholeMarket.id,
    winningOutcomeId: outcome(cornholeMarket, "Karl & Thom").id,
  });

  console.log("Voiding the grill market (rained out before it could catch fire)...");
  await voidMarket(grillMarket.id);

  console.log("Applying an admin fine for flavor...");
  await adjustPlayerBalance({
    playerId: players.William!.id,
    amount: -25,
    reason: "Bøde: mistede en sandal i søen",
  });

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
