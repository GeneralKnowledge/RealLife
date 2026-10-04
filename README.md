# Get Outside

MVP for testing whether highly targeted outdoor-trip creatives can drive clicks through to bookable affiliate activities (Viator).

Focus market: **Scotland**.

## What this answers

> Can we attract people with highly targeted outdoor-trip content and get them to click through to real bookable activities?

Tracked funnel:

1. Creative impression (`/c/[slug]`)
2. Creative click (`/api/go/[slug]`)
3. Landing page view (`/escape/[slug]`)
4. Affiliate outbound click (`/api/affiliate/[id]`)

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (local)
- Vitest + Playwright
- pnpm

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm db:push
pnpm db:seed
pnpm dev
```

Open:

- Public site: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)  
  Default token: `dev-admin-token`

## Provider abstraction

Activities come from an `ActivityProvider` interface:

- `mock` (default) — Scotland outdoor sample inventory for local demos
- `viator` — Viator Partner API (`/products/search`)

Switch with env:

```bash
ACTIVITY_PROVIDER=mock
# or
ACTIVITY_PROVIDER=viator
VIATOR_API_KEY=...
VIATOR_AFFILIATE_ID=...
VIATOR_DESTINATION_ID=22
```

Sync inventory from the admin Activities page, or:

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "x-admin-token: dev-admin-token"
```

## Admin flow

1. Log in with `ADMIN_TOKEN`
2. Sync / browse Scotland activities
3. Filter by location, type, price, duration, rating
4. Generate a creative
5. Share `/c/[slug]` (ad preview) or `/api/go/[slug]` (tracked click)
6. Watch funnel stats on `/admin`

## Tests

```bash
pnpm test
pnpm build
pnpm test:e2e
```

## Notes

- No auth product, payments, or in-app booking — affiliate handoff only
- Additional providers can implement `ActivityProvider` without changing the UI
- SQLite keeps local setup to a handful of commands; swap `DATABASE_URL` for Postgres later if needed
