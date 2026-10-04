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
- Content AI via OpenRouter (OpenAI-compatible; upgrade path: OpenAI)
- Vitest + Playwright
- pnpm

## Setup

**Staged setup guide:** see **[SETUP.md](SETUP.md)** (prerequisites → install → env → DB → run → optional AI / Viator / Postgres → tests → launch).

Minimum local demo (mock data, no Docker):

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
  Default token: `dev-admin-token` (set `ADMIN_TOKEN` in `.env`)

Optional content AI: set OpenRouter keys in `.env` (see SETUP.md Stage 5).

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
# After logging into /admin (cookie session), or with header for scripts:
curl -X POST http://localhost:3000/api/sync \
  -H "x-admin-token: $ADMIN_TOKEN"
```

Composited creatives (for ads / link previews):

```text
/api/og/creative/<slug>?format=square|story|og
```

Download zip (admin session required): `/api/og/pack/<slug>`

## Admin flow

1. Log in with `ADMIN_TOKEN`
2. Sync / browse Scotland activities
3. Filter by location, type, price, duration, rating
4. Generate a creative (also auto-builds a social pack)
5. Open **Social** to copy Instagram / Story / X / Facebook / TikTok captions
6. Share `/c/[slug]` (ad preview) or `/api/go/[slug]` (tracked click)
7. Watch funnel stats on `/admin`

### Social content generation

Every creative gets an automatic multi-platform pack:

- Instagram feed + story
- X / Twitter (length-capped)
- Facebook
- TikTok

By default captions use templates. For AI headlines + captions, use **OpenRouter** (works locally and on Vercel; same key can serve other projects):

```bash
# https://openrouter.ai/keys
CONTENT_AI_BASE_URL=https://openrouter.ai/api/v1
CONTENT_AI_API_KEY=sk-or-...
CONTENT_AI_MODEL=openai/gpt-4o-mini
CONTENT_AI_STRUCTURED_OUTPUTS=true

pnpm llm:smoke   # optional connectivity check
```

Upgrade to OpenAI later (same app code — swap env only):

```bash
CONTENT_AI_BASE_URL=https://api.openai.com/v1
CONTENT_AI_API_KEY=sk-...
CONTENT_AI_MODEL=gpt-4o-mini
CONTENT_AI_STRUCTURED_OUTPUTS=true
```

Optional laptop-only free-tier router: `pnpm llm:setup` (FreeLLMAPI on `:3001`) — not for Vercel. When the model call fails, generation falls back to templates. Regenerate anytime from Admin → Social or a creative detail page.

## Tests

```bash
pnpm test
pnpm build
pnpm test:e2e
```

## Brand

See **[BRAND.md](BRAND.md)** for voice, theme, colour, type, and creative rules so ads, social, and landing pages stay consistent.

## Launch / deploy

| Doc | Use when |
|---|---|
| **[SETUP.md](SETUP.md)** | Local install (SQLite, optional FreeLLMAPI) |
| **[DEPLOY.md](DEPLOY.md)** | Production backend: Vercel + Neon/Supabase, env vars, domain, Viator |
| **[LAUNCH.md](LAUNCH.md)** | Accounts, domain shortlist, pre-paid-traffic checklist |

## Notes

- No auth product, payments, or in-app booking — affiliate handoff only
- Additional providers can implement `ActivityProvider` without changing the UI
- SQLite for local; Postgres (Neon/Supabase) for production — see [DEPLOY.md](DEPLOY.md)
- Admin APIs authenticate via httpOnly session cookie (no token in client HTML)
