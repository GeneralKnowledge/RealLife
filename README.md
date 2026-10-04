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

Editorial news (Outside briefing) is separate: `news_impression` → `news_click` via `/api/news/go/[id]`, with optional soft links into escapes.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (local)
- FreeLLMAPI ([tashfeenahmed/freellmapi](https://github.com/tashfeenahmed/freellmapi)) for cheap local content AI
- Vitest + Playwright
- pnpm

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm db:push
pnpm db:seed
pnpm llm:setup   # optional but recommended — starts FreeLLMAPI on :3001
pnpm dev
```

Open:

- Public site: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)  
  Default token: `dev-admin-token`
- FreeLLMAPI dashboard: [http://localhost:3001](http://localhost:3001)

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

By default captions use templates. For AI headlines + captions locally, use **FreeLLMAPI** (free-tier router, OpenAI-compatible `/v1`):

```bash
pnpm llm:setup
# Open http://localhost:3001 → add free provider keys (Groq, Google AI Studio, …)
# Copy the unified freellmapi-… key into .env:

CONTENT_AI_BASE_URL=http://127.0.0.1:3001/v1
CONTENT_AI_API_KEY=freellmapi-YOUR_UNIFIED_KEY
CONTENT_AI_MODEL=auto:cheap
CONTENT_AI_STRUCTURED_OUTPUTS=false

pnpm llm:smoke   # optional connectivity check
```

Helpers: `pnpm llm:up` / `pnpm llm:down` / `pnpm llm:logs`.

Declarative provider keys (optional): edit `freellmapi/config.example.json` → `freellmapi/config.json`, then `pnpm llm:up`. See the [FreeLLMAPI install docs](https://github.com/tashfeenahmed/freellmapi/blob/main/docs/en/install/01-install.md).

Other OpenAI-compatible backends still work (OpenAI, OpenRouter, Ollama). When the model call fails, generation falls back to templates. Regenerate anytime from Admin → Social or a creative detail page.

## Tests

```bash
pnpm test
pnpm build
pnpm test:e2e
```

## Outside briefing (RSS news)

Cached Scotland/outdoors RSS for theme-building — never fetched on page view.

- Public: `/` (below escapes) and `/news`
- Admin: `/admin/news` — Sync feeds (TTL) / Force refresh, publish/hide
- Env: `NEWS_RSS_FEEDS`, `NEWS_SYNC_TTL_HOURS` (default 6), `NEWS_MAX_ITEMS`
- Sync: `POST /api/news/sync` with optional `{ "force": true }`

Seed includes sample briefing items so local demos work offline.

## Brand

See **[BRAND.md](BRAND.md)** for voice, theme, colour, type, creative rules, the news experiment checklist, and a future partner playbook.

## Launch

See **[LAUNCH.md](LAUNCH.md)** for accounts, domain shortlist, Vercel + Postgres deploy, and the pre-paid-traffic checklist.

```bash
# FreeLLMAPI (content AI)
pnpm llm:setup

# Optional local Postgres
docker compose --profile postgres up -d
# then switch prisma provider to postgresql and set DATABASE_URL
```

## Notes

- No auth product, payments, or in-app booking — affiliate handoff only
- Additional providers can implement `ActivityProvider` without changing the UI
- SQLite for local; Postgres (Neon/Supabase) for production — see LAUNCH.md
- Admin APIs authenticate via httpOnly session cookie (no token in client HTML)
