# Get Outside — Setup Guide

Staged instructions to get the app running locally. Stop after **Stage 4** if you only need a demo with mock data; continue for AI captions, live Viator inventory, or production prep.

## Stage 0 — Prerequisites

Install these before anything else:

| Tool | Version / notes |
|---|---|
| [Node.js](https://nodejs.org/) | **22** (matches CI) |
| [pnpm](https://pnpm.io/) | **10.33.3** (`corepack enable` then `corepack prepare pnpm@10.33.3 --activate`) |
| Git | Any recent version |
| [Docker](https://docs.docker.com/get-docker/) | Only needed for FreeLLMAPI (Stage 5) or local Postgres (Stage 7) |

Optional later:

- Viator Partner API key + affiliate ID (Stage 6)
- Free-tier LLM keys (Groq, Google AI Studio, etc.) for FreeLLMAPI (Stage 5)

## Stage 1 — Clone and install

```bash
git clone https://github.com/GeneralKnowledge/RealLife.git
cd RealLife

pnpm install
```

`postinstall` runs `prisma generate` automatically.

## Stage 2 — Environment file

```bash
cp .env.example .env
```

Minimum values for a local mock demo:

```bash
DATABASE_URL="file:./dev.db"
ACTIVITY_PROVIDER="mock"
ADMIN_TOKEN="dev-admin-token"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Leave Viator and Content AI vars empty for now. Change `ADMIN_TOKEN` before any shared or public deploy.

## Stage 3 — Database (SQLite)

Local default is SQLite — no Docker required.

```bash
pnpm db:push
pnpm db:seed
```

This creates `prisma/dev.db` (via `DATABASE_URL`) and loads Scotland sample activities for the mock provider.

Useful variants:

```bash
pnpm db:migrate   # create/apply named Prisma migrations during schema work
pnpm db:setup     # migrate deploy + seed (closer to a deploy-style bootstrap)
```

## Stage 4 — Run the app

```bash
pnpm dev
```

Open:

| URL | Purpose |
|---|---|
| [http://localhost:3000](http://localhost:3000) | Public site |
| [http://localhost:3000/admin](http://localhost:3000/admin) | Admin (token from `ADMIN_TOKEN`) |

Smoke-check the funnel with mock data:

1. Log in at `/admin`
2. Browse Activities → generate a creative
3. Open `/c/[slug]` (creative impression)
4. Follow a tracked click via `/api/go/[slug]` → landing `/escape/[slug]`
5. Confirm affiliate outbound appears on admin stats

You now have a working local MVP. Stages below are optional.

---

## Stage 5 — Content AI (FreeLLMAPI) — optional

Enables AI headlines and multi-platform social captions. Without this, creatives fall back to templates.

Requires Docker.

```bash
pnpm llm:setup
```

That script will:

1. Create `freellmapi/.env` with an encryption key
2. Start FreeLLMAPI on [http://127.0.0.1:3001](http://127.0.0.1:3001)
3. Stub `CONTENT_AI_*` in your app `.env` if missing

Then:

1. Open the FreeLLMAPI dashboard → add free provider keys (or copy `freellmapi/config.example.json` → `freellmapi/config.json` and restart)
2. Copy the unified `freellmapi-…` key from the Keys page into `.env`:

```bash
CONTENT_AI_BASE_URL=http://127.0.0.1:3001/v1
CONTENT_AI_API_KEY=freellmapi-YOUR_UNIFIED_KEY
CONTENT_AI_MODEL=auto:cheap
CONTENT_AI_STRUCTURED_OUTPUTS=false
```

3. Restart `pnpm dev` if it was already running
4. Optional connectivity check: `pnpm llm:smoke`

Day-to-day helpers:

```bash
pnpm llm:up      # start (or run setup if .env missing)
pnpm llm:down    # stop
pnpm llm:logs    # follow logs
```

Other OpenAI-compatible backends (OpenAI, OpenRouter, Ollama) also work via the same `CONTENT_AI_*` vars — see comments in `.env.example`.

## Stage 6 — Live Viator activities — optional

Switch from mock inventory to the Viator Partner API:

1. Sign up at [Viator Partners](https://partners.viator.com) and copy your API key + affiliate PID
2. Update `.env`:

```bash
ACTIVITY_PROVIDER=viator
VIATOR_API_KEY=...
VIATOR_AFFILIATE_ID=...
VIATOR_API_BASE_URL=https://api.viator.com/partner
VIATOR_DESTINATION_ID=22
```

3. Restart `pnpm dev`
4. In admin → Activities → Sync, or:

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "x-admin-token: $ADMIN_TOKEN"
```

## Stage 7 — Local Postgres — optional

Only if you want to mirror production Postgres locally. Default SQLite is enough for most development.

```bash
docker compose --profile postgres up -d
```

Then:

1. In `prisma/schema.prisma`, set the datasource provider to `postgresql`
2. Set in `.env`:

```bash
DATABASE_URL="postgresql://getoutside:getoutside@localhost:5432/getoutside"
```

3. Apply schema and seed:

```bash
pnpm exec prisma migrate deploy
# or: pnpm db:push
pnpm db:seed
```

## Stage 8 — Verify (tests)

With the app env in place:

```bash
pnpm test
pnpm lint
pnpm build
```

End-to-end (starts against a running app or Playwright’s webServer per `playwright.config.ts`):

```bash
pnpm test:e2e
```

Install Playwright browsers once if needed: `pnpm exec playwright install`.

## Stage 9 — Production / paid traffic

Do **not** treat local FreeLLMAPI as a public production service.

- **Backend deploy (Vercel + Neon):** **[DEPLOY.md](DEPLOY.md)**
- **Accounts, domains, paid-traffic checklist:** **[LAUNCH.md](LAUNCH.md)**
- **Brand voice / creative rules:** **[BRAND.md](BRAND.md)**

---

## Quick reference

| Goal | Stages |
|---|---|
| Local demo (mock data) | 0 → 4 |
| + AI social captions | + 5 |
| + Real Viator inventory | + 6 |
| + Local Postgres | + 7 |
| Production backend | → [DEPLOY.md](DEPLOY.md) |
| Paid ads readiness | → [LAUNCH.md](LAUNCH.md) |
