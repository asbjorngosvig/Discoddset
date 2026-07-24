# Sommerhus Bookmaker

Play-money betting on absurd weekend-trip events. One bookmaker sets the
odds, everyone else bets from their phone.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Postgres via Prisma, with all money-moving logic in [`lib/betting.ts`](lib/betting.ts)
- Server Actions for every mutation — no separate API layer
- Cookie-based "auth": pick a name, no passwords. Admin routes are gated by a
  single shared PIN from an env var.

## Local setup

Requires Node 18+ and Docker (for a local Postgres — no separate install
needed).

```bash
docker compose up -d
npm install
cp .env.example .env   # already points at the docker-compose database
```

Push the schema, then seed some demo data:

```bash
npx prisma db push
npm run db:seed
```

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000` on your phone (same Wi-Fi) or in a browser. Pick
a player name to get in. Visit `/admin` and enter the PIN from `.env` to
create/close/settle/void markets, add players, and adjust balances.

## Re-seeding

`npm run db:seed` wipes all players, markets, bets, and balance history and
recreates 6 demo players plus a handful of joke markets (some open, one
already settled, one voided) so the app has something to look at immediately.
**Only run this before a trip, against a throwaway/dev database** — once real
players have real bets and balances, re-seeding deletes all of it. To add a
player after that point, use the "Tilføj spiller" (add player) form on
`/admin` instead — it creates them with the standard 1000 kr starting
balance and doesn't touch anyone else's data.

## Deploying (Vercel + Postgres)

1. **Create a Postgres database.** [Neon](https://neon.tech) has a free tier,
   provisions instantly, and pairs well with Vercel — but Vercel Postgres or
   Supabase work identically since this is just a standard Prisma/Postgres
   setup. Copy the connection string it gives you.
2. **Push the schema to it once**, from your machine, before the first
   deploy:
   ```bash
   DATABASE_URL="<your production connection string>" npx prisma db push
   ```
   (Optionally seed it too with the same env var prefix — see the warning
   above about re-seeding a live database.)
3. **Push this repo to GitHub** and import it in Vercel (or run `vercel` from
   the CLI).
4. **Set two environment variables** in the Vercel project settings:
   - `DATABASE_URL` — the same connection string from step 1
   - `ADMIN_PIN` — pick a real PIN for the trip, not `1234`
5. Deploy. Vercel runs `npm install` → `postinstall` (which runs
   `prisma generate`) → `npm run build` automatically; no other config
   needed.

Everyone opens the deployed URL on their phone, picks their name, and bets.
You open `/admin` from your phone with the PIN to run things.

## Project layout

- `prisma/schema.prisma` — data model (Player, Market, Outcome, Bet,
  BalanceTransaction)
- `lib/betting.ts` — every rule that moves money or changes market state
  (placing bets, closing/settling/voiding markets, editing odds, admin
  balance adjustments). Settlement and voiding are idempotent — calling them
  twice never double-pays.
- `lib/session.ts` — cookie-based player/admin session helpers
- `middleware.ts` — redirects to `/select-player` if no player cookie is set
- `app/` — the four screens (`/`, `/me`, `/leaderboard`, `/admin`) plus
  server actions
- `components/` — UI, split into player-facing components and
  `components/admin/`
- `public/avatars/` — one image per player, referenced by path in the
  `Player.avatar` column. Placeholder SVGs are checked in for the seeded
  players (`karl.svg`, `klose.svg`, `kla.svg`, `thom.svg`, `william.svg`,
  `zak.svg`) plus `default.svg` for anyone added later — swap the files with
  real photos any time (keep the filenames, or update the `avatar` path on
  the Player row to point at a new file). Recommended: square images,
  ideally ≥128×128px; they're rendered as circles.

## Notes

- No websockets. The markets page (`/`) does a `router.refresh()` every 15s
  so bets/odds/settlements from other phones show up without a manual pull.
- Odds are locked in at the moment a bet is placed (`oddsAtPlacement`) — later
  admin edits never change existing bets.
- Admin can only edit an outcome's odds while its market is `OPEN` and has no
  bets yet on *any* of its outcomes; once money is down, odds are frozen.
- New markets don't have a closing time — admin closes/settles/voids them
  manually whenever the event is decided.
