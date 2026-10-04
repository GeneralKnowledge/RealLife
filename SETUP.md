# Get Outside — Setup Guide

Staged instructions to get the app running locally. Stop after **Stage 4** if you only need a demo with mock data; continue for AI captions, live Viator inventory, or production prep.

## Stage 0 — Prerequisites

Install these before anything else:

| Tool | Version / notes |
|---|---|
| [Node.js](https://nodejs.org/) | **22** (matches CI) |
| [pnpm](https://pnpm.io/) | **10.33.3** (`corepack enable` then `corepack prepare pnpm@10.33.3 --activate`) |
| Git | Any recent version |
| [Docker](https://docs.docker.com/get-docker/) | Only needed for optional local FreeLLMAPI or Postgres (Stage 7) |

Optional later:

- [OpenRouter](https://openrouter.ai/keys) API key for content AI (Stage 5)
- Viator Partner API key + affiliate ID (Stage 6)

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

## Stage 5 — Content AI (OpenRouter) — optional

Enables AI headlines and multi-platform social captions. Without this, creatives fall back to templates.

**Recommended provider: [OpenRouter](https://openrouter.ai/)** — always available, works on your laptop and on Vercel, and one key can serve other projects. Upgrade later to OpenAI by swapping env vars only.

1. Create a key at [openrouter.ai/keys](https://openrouter.ai/keys)
2. Put these in `.env` (already stubbed in `.env.example`):

```bash
CONTENT_AI_BASE_URL=https://openrouter.ai/api/v1
CONTENT_AI_API_KEY=sk-or-YOUR_KEY
CONTENT_AI_MODEL=openai/gpt-4o-mini
CONTENT_AI_STRUCTURED_OUTPUTS=true
```

3. Restart `pnpm dev` if it was already running
4. Optional connectivity check: `pnpm llm:smoke`
5. In admin, generate a creative or regenerate a social pack

### Upgrade path — OpenAI

Same code path; only env changes:

```bash
CONTENT_AI_BASE_URL=https://api.openai.com/v1
CONTENT_AI_API_KEY=sk-...
CONTENT_AI_MODEL=gpt-4o-mini
CONTENT_AI_STRUCTURED_OUTPUTS=true
```

### Optional — local FreeLLMAPI (laptop only)

Docker free-tier router if you want zero cloud LLM spend while developing:

```bash
pnpm llm:setup
# dashboard http://127.0.0.1:3001 → add Groq / Google keys → copy freellmapi-… key

CONTENT_AI_BASE_URL=http://127.0.0.1:3001/v1
CONTENT_AI_API_KEY=freellmapi-YOUR_UNIFIED_KEY
CONTENT_AI_MODEL=auto:cheap
CONTENT_AI_STRUCTURED_OUTPUTS=false
```

Helpers: `pnpm llm:up` / `pnpm llm:down` / `pnpm llm:logs`.  
Do **not** point Vercel at `127.0.0.1` — use OpenRouter (or OpenAI) in production.

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

Use the same OpenRouter (or OpenAI) `CONTENT_AI_*` values on Vercel — not local FreeLLMAPI.

- **Backend deploy (Vercel + Neon):** **[DEPLOY.md](DEPLOY.md)**
- **Accounts, domains, paid-traffic checklist:** **[LAUNCH.md](LAUNCH.md)**
- **Brand voice / creative rules:** **[BRAND.md](BRAND.md)**

---

## Quick reference

| Goal | Stages |
|---|---|
| Local demo (mock data) | 0 → 4 |
| + AI social captions (OpenRouter) | + 5 |
| + Real Viator inventory | + 6 |
| + Local Postgres | + 7 |
| Production backend | → [DEPLOY.md](DEPLOY.md) |
| Paid ads readiness | → [LAUNCH.md](LAUNCH.md) |
