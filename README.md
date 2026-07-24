# Sommerhus Bookmaker

Play-money betting on absurd weekend-trip events. One bookmaker sets the
odds, everyone else bets from their phone.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Postgres (Neon) via Prisma, using Neon's serverless driver adapter
  ([`lib/prisma.ts`](lib/prisma.ts)) so it works cleanly from Vercel's
  serverless functions. All money-moving logic lives in
  [`lib/betting.ts`](lib/betting.ts).
- Server Actions for every mutation — no separate API layer
- Cookie-based "auth": pick a name, no passwords. Admin routes are gated by a
  single shared PIN from an env var.

## Database

This project already has a Neon project connected (see `.neon` — safe to
commit, no secrets in it) with the schema migrated and seeded. `.env` holds
the real connection strings (`DATABASE_URL` pooled, `DATABASE_URL_UNPOOLED`
direct — Prisma Migrate needs the direct one; app runtime queries use the
pooled one). `.env` is gitignored, so anyone else working on this pulls their
own with `npx neon env pull` (requires being added to the Neon project) or
you share the values directly.

If you'd rather develop against a fully local, throwaway database instead of
the shared Neon one day-to-day, `docker-compose.yml` spins up a local
Postgres:

```bash
docker compose up -d
# then point DATABASE_URL in .env at:
# postgresql://sommerhus:sommerhus@localhost:5432/sommerhus
npx prisma migrate deploy
npm run db:seed
```

Switch `DATABASE_URL` back to the Neon string when you want to see real
shared data again.

## Local setup

Requires Node 18+.

```bash
npm install
npm run dev
```

(`npm install` also runs `prisma generate` via `postinstall`.) Open
`http://localhost:3000` on your phone (same Wi-Fi) or in a browser. Pick a
player name to get in. Visit `/admin` and enter the PIN from `.env` to
create/close/settle/void markets, add players, and adjust balances.

## Re-seeding

`npm run db:seed` wipes all markets, bets, and balance history and recreates
the player roster (Karl, Klose, klå, Thom, Lyng, Zak) at the standard 1000 kr
starting balance — no demo markets. **Only run this to reset for a new
trip** — once real bets/balances exist, re-seeding deletes all of it. To add
a player without wiping anyone else's data, use the "Tilføj spiller" (add
player) form on `/admin` instead.

## Schema changes

The schema is under migration control (`prisma/migrations/`), not just
`db push`. After editing `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name <what-changed>
```

This updates the connected database (via `DATABASE_URL_UNPOOLED`), records a
migration file, and regenerates the client. Commit the new migration folder.

## Deploying (Vercel)

The database side is already done — schema is migrated and seeded on Neon.
What's left is putting the app on Vercel:

1. **Push this repo to GitHub** and import it in Vercel (or run `vercel` from
   the CLI).
2. **Set environment variables** in the Vercel project settings — copy the
   values straight from your local `.env`:
   - `DATABASE_URL`
   - `ADMIN_PIN` — pick a real PIN for the trip, not `1234`
3. Deploy. Vercel runs `npm install` → `postinstall` (which runs
   `prisma generate`) → `npm run build` automatically; no other config
   needed.

Everyone opens the deployed URL on their phone, picks their name, and bets.
You open `/admin` from your phone with the PIN to run things.

If you ever need a *different* Postgres provider instead of Neon (Vercel
Postgres, Supabase, a self-hosted instance, whatever), nothing here is
Neon-specific except the driver adapter in `lib/prisma.ts` — swap that file
back to a plain `new PrismaClient()` (no adapter) and point `DATABASE_URL` at
the new provider.

## Project layout

- `prisma/schema.prisma` — data model (Player, Market, Outcome, Bet,
  BalanceTransaction)
- `prisma/migrations/` — version-controlled schema history; applied with
  `prisma migrate deploy` (or `dev` locally when you change the schema)
- `lib/betting.ts` — every rule that moves money or changes market state
  (placing bets, closing/settling/voiding markets, editing odds, admin
  balance adjustments). Settlement and voiding are idempotent — calling them
  twice never double-pays.
- `lib/prisma.ts` — Prisma client wired to Neon's serverless driver adapter
- `lib/session.ts` — cookie-based player/admin session helpers
- `lib/constants.ts` — cookie names and status/type constants. Cookie names
  live here rather than in `lib/session.ts` specifically so `middleware.ts`
  (Edge runtime) can read them without pulling in Prisma/the Neon driver
  through `lib/session.ts`'s import chain
- `middleware.ts` — redirects to `/select-player` if no player cookie is set
- `app/` — the four screens (`/`, `/me`, `/leaderboard`, `/admin`) plus
  server actions
- `components/` — UI, split into player-facing components and
  `components/admin/`
- `public/ranks/` — the six leaderboard rank badges (Challenger down to
  Bronze), assigned by position. Original placeholder art (not Riot Games'
  emblems) — swap the files for real ones any time, same filenames.
- `docker-compose.yml` — optional local-only Postgres, see "Database" above

## Notes

- No websockets. The markets page (`/`) does a `router.refresh()` every 15s
  so bets/odds/settlements from other phones show up without a manual pull.
- Odds are locked in at the moment a bet is placed (`oddsAtPlacement`) — later
  admin edits never change existing bets.
- Admin can only edit an outcome's odds while its market is `OPEN` and has no
  bets yet on *any* of its outcomes; once money is down, odds are frozen.
- New markets don't have a closing time — admin closes/settles/voids them
  manually whenever the event is decided.
