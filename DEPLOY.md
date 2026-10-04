# Get Outside — Production Deploy (Vercel + Neon)

Staged instructions to put the app on a real backend: **Vercel** (Next.js hosting) + **Neon** (Postgres). Supabase Postgres works the same way if you prefer it.

Local-first install: **[SETUP.md](SETUP.md)**.  
After deploy, paid-traffic checklist: **[LAUNCH.md](LAUNCH.md)**.

> **Important:** Local default is **SQLite**. Production must use **PostgreSQL**. Existing Prisma migrations under `prisma/migrations/` are SQLite-flavoured, so Stage 2 recreates them for Postgres before Vercel’s `prisma migrate deploy` can succeed (`vercel.json` runs that on every build).

## Stage 0 — Open accounts

Do these first (free tiers are enough to start):

| Account | Why |
|---|---|
| [GitHub](https://github.com) | Repo already here — Vercel imports from it |
| [Neon](https://neon.tech) (or [Supabase](https://supabase.com)) | Production Postgres |
| [Vercel](https://vercel.com) | Host Next.js + run migrations at build |
| [Viator Partners](https://partners.viator.com) | Live Scotland inventory + affiliate links |
| Domain registrar (Cloudflare / Porkbun / Namecheap) | Custom domain (can wait until Stage 6) |

Optional later: PostHog, Meta Pixel, OpenRouter (content AI; OpenAI upgrade path).

Generate a strong admin secret now:

```bash
openssl rand -hex 32
```

Save it as `ADMIN_TOKEN` — never use `dev-admin-token` / `change-me` in production.

## Stage 1 — Create Neon Postgres

1. Sign in at [neon.tech](https://neon.tech) → **New project** (region close to your users; `eu-west` is a good default for Scotland-focused traffic).
2. Open the project → **Connection details**.
3. Copy **two** connection strings (Prisma on Vercel needs both):

| Neon label | Env var | Use |
|---|---|---|
| **Pooled** (recommended for serverless; often includes `-pooler` in the host) | `DATABASE_URL` | App runtime queries |
| **Direct** (non-pooled) | `DIRECT_URL` | `prisma migrate deploy` during Vercel build |

Both should look like:

```text
postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
```

If Neon only shows one string, use it for both vars for now; add a pooled URL when Neon offers it.

**Supabase alternative:** Project Settings → Database → URI. Use the pooled/transaction mode URL for `DATABASE_URL` and the direct URI for `DIRECT_URL`, both with `sslmode=require`.

## Stage 2 — Switch Prisma to PostgreSQL (one-time code change)

On a branch (do this before the first Vercel deploy):

### 2a. Update the schema

In [`prisma/schema.prisma`](prisma/schema.prisma):

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 2b. Replace SQLite migrations with Postgres ones

The committed migrations use SQLite types (`DATETIME`, `REAL`, etc.) and will fail on Neon. Reset the migration history for Postgres:

```bash
# From repo root — remove old SQLite migration folders
rm -rf prisma/migrations

# Point at Neon (use the DIRECT / non-pooled URL for migrate)
export DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
export DIRECT_URL="$DATABASE_URL"

# Create a fresh Postgres migration from the current schema (empty DB)
pnpm exec prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > /tmp/init_postgres.sql

mkdir -p prisma/migrations/20261004000000_init_postgres
mv /tmp/init_postgres.sql prisma/migrations/20261004000000_init_postgres/migration.sql

# Apply against Neon (empty database)
pnpm exec prisma migrate deploy
```

Simpler equivalent if the Neon database is still empty and you are fine letting Prisma name the migration:

```bash
export DATABASE_URL="postgresql://…"
export DIRECT_URL="$DATABASE_URL"
rm -rf prisma/migrations
pnpm exec prisma migrate dev --name init_postgres
```

(`migrate dev` applies to the DB and writes `prisma/migrations/…`.)

### 2c. Commit the Prisma change

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "Use PostgreSQL for production (Neon)"
git push
```

After this commit, **local SQLite no longer matches the schema**. For day-to-day local work either:

- Use Docker Postgres (`docker compose --profile postgres up -d`) and point `.env` at  
  `postgresql://getoutside:getoutside@localhost:5432/getoutside`, or  
- Keep a separate local branch / env that still uses SQLite (not recommended long-term).

CI (`.github/workflows/ci.yml`) currently uses `file:./ci.db` + `db push`. After switching the schema provider to `postgresql`, update CI to a Postgres service or Neon branch — otherwise CI will fail. Minimal GitHub Actions Postgres service:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: getoutside
      POSTGRES_PASSWORD: getoutside
      POSTGRES_DB: getoutside
    ports: ["5432:5432"]
env:
  DATABASE_URL: postgresql://getoutside:getoutside@localhost:5432/getoutside
  DIRECT_URL: postgresql://getoutside:getoutside@localhost:5432/getoutside
```

Then use `pnpm exec prisma migrate deploy` (or `db push`) instead of a SQLite file URL.

## Stage 3 — Seed or prepare inventory on Neon

With `DATABASE_URL` / `DIRECT_URL` set in your shell:

```bash
# Optional: sample Scotland mock activities (fine for a first smoke deploy)
pnpm db:seed
```

For a real ads test, prefer **Viator sync from admin after deploy** (Stage 8) and skip mock seed, or seed then overwrite via sync.

## Stage 4 — Create the Vercel project

1. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → import `GeneralKnowledge/RealLife` (or your fork).
2. Framework: **Next.js** (auto-detected). `vercel.json` already sets:
   - `buildCommand`: `prisma generate && prisma migrate deploy && next build`
3. **Root directory:** repo root (default).
4. **Install command:** leave default (`pnpm install` from `packageManager`).
5. Before the first deploy, open **Environment Variables** and add the values from Stage 5 (Production + Preview).

Do **not** deploy until env vars are saved.

## Stage 5 — Production environment variables

In Vercel → Project → **Settings → Environment Variables**, add at least:

| Name | Example / notes | Environments |
|---|---|---|
| `DATABASE_URL` | Neon **pooled** URL (`sslmode=require`) | Production, Preview |
| `DIRECT_URL` | Neon **direct** URL | Production, Preview |
| `ADMIN_TOKEN` | Output of `openssl rand -hex 32` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` first; later your custom domain | Production, Preview |
| `ACTIVITY_PROVIDER` | `mock` for first smoke deploy, then `viator` | Production, Preview |

When ready for live inventory:

| Name | Notes |
|---|---|
| `VIATOR_API_KEY` | From Viator Partners |
| `VIATOR_AFFILIATE_ID` | Affiliate PID |
| `VIATOR_API_BASE_URL` | `https://api.viator.com/partner` |
| `VIATOR_DESTINATION_ID` | `22` (Scotland — confirm in Viator `/destinations`) |

Optional analytics:

| Name | Notes |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | e.g. `https://us.i.posthog.com` |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel ID |

Production content AI (optional — templates work without it):

| Name | Notes |
|---|---|
| `CONTENT_AI_BASE_URL` | `https://openrouter.ai/api/v1` (recommended) |
| `CONTENT_AI_API_KEY` | OpenRouter key from https://openrouter.ai/keys |
| `CONTENT_AI_MODEL` | e.g. `openai/gpt-4o-mini` |
| `CONTENT_AI_STRUCTURED_OUTPUTS` | `true` for OpenRouter/OpenAI |

**Do not** set `CONTENT_AI_BASE_URL` to `http://127.0.0.1:3001/v1` on Vercel — use OpenRouter (or upgrade to OpenAI).

Full template (copy/paste into notes, then fill in Vercel UI):

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler/neondb?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
ADMIN_TOKEN=
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
ACTIVITY_PROVIDER=mock

# Later:
# ACTIVITY_PROVIDER=viator
# VIATOR_API_KEY=
# VIATOR_AFFILIATE_ID=
# VIATOR_API_BASE_URL=https://api.viator.com/partner
# VIATOR_DESTINATION_ID=22
# CONTENT_AI_BASE_URL=https://openrouter.ai/api/v1
# CONTENT_AI_API_KEY=
# CONTENT_AI_MODEL=openai/gpt-4o-mini
# CONTENT_AI_STRUCTURED_OUTPUTS=true
# OpenAI upgrade: BASE_URL=https://api.openai.com/v1 MODEL=gpt-4o-mini
# NEXT_PUBLIC_POSTHOG_KEY=
# NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
# NEXT_PUBLIC_META_PIXEL_ID=
```

## Stage 6 — First deploy

1. In Vercel, click **Deploy** (or push to the connected Git branch).
2. Watch the build log. You should see:
   - `prisma generate`
   - `prisma migrate deploy` (applies `init_postgres`)
   - `next build`
3. Open the deployment URL:
   - `/` — public home
   - `/admin` — log in with `ADMIN_TOKEN`
4. If you seeded in Stage 3, browse Activities / generate a creative.  
   If not, stay on `ACTIVITY_PROVIDER=mock` and run seed once against Neon from your laptop:

```bash
export DATABASE_URL="postgresql://…"   # pooled or direct is fine for seed
export DIRECT_URL="postgresql://…"
export NEXT_PUBLIC_APP_URL="https://your-project.vercel.app"
pnpm db:seed
```

### Common deploy failures

| Symptom | Fix |
|---|---|
| `migrate deploy` fails on `DATETIME` / SQLite SQL | Stage 2 not done — recreate Postgres migrations |
| `Environment variable not found: DATABASE_URL` | Add vars in Vercel; redeploy |
| `Can't reach database server` | Wrong host, missing `sslmode=require`, or IP allowlist |
| Admin login fails in production | `ADMIN_TOKEN` unset/mismatched; cookie needs HTTPS (`secure` in prod) |
| Build OK but empty activities | Seed (above) or Stage 8 Viator sync |

## Stage 7 — Custom domain

1. Buy a domain (shortlist in [LAUNCH.md](LAUNCH.md)).
2. Vercel → Project → **Settings → Domains** → add the domain.
3. At your DNS host, add the records Vercel shows (usually an `A` / `CNAME`). Cloudflare: proxy can stay orange once SSL is fine; if issues, try DNS-only first.
4. Update Vercel env:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain
```

5. Redeploy so server-side absolute URLs (OG images, affiliate redirects, social CTA links) use the new origin.
6. Confirm:
   - `https://your-domain/`
   - `https://your-domain/admin`
   - `https://your-domain/api/og/creative/<slug>?format=square`

## Stage 8 — Live Viator inventory

1. Set in Vercel (Production):

```bash
ACTIVITY_PROVIDER=viator
VIATOR_API_KEY=…
VIATOR_AFFILIATE_ID=…
VIATOR_API_BASE_URL=https://api.viator.com/partner
VIATOR_DESTINATION_ID=22
```

2. Redeploy.
3. Log into `/admin` → sync Activities, or:

```bash
curl -X POST https://your-domain/api/sync \
  -H "x-admin-token: $ADMIN_TOKEN"
```

4. Generate a creative from a synced activity and walk the funnel:
   - `/c/[slug]` → impression  
   - `/api/go/[slug]` → tracked click  
   - `/escape/[slug]` → landing  
   - affiliate outbound → Viator  

## Stage 9 — Production content AI (optional)

Templates still work with no AI. For AI headlines/captions on Vercel:

1. Create an [OpenRouter](https://openrouter.ai/keys) key (recommended — same key works locally and across projects).
2. Set `CONTENT_AI_*` in Vercel (Stage 5 table) to the OpenRouter values.
3. Redeploy; generate a creative or regenerate Social from admin.
4. To upgrade later to OpenAI, swap `CONTENT_AI_BASE_URL` / `CONTENT_AI_API_KEY` / `CONTENT_AI_MODEL` only (see `.env.example`).
5. If the model call fails, the app falls back to templates automatically.

## Stage 10 — Verify before paid traffic

- [ ] Vercel deploy green; `prisma migrate deploy` in build logs
- [ ] Neon shows tables (`Activity`, `Creative`, `Event`, `SocialPost`, …)
- [ ] `/admin` works with production `ADMIN_TOKEN`
- [ ] Activities present (seed and/or Viator sync)
- [ ] Creative + social pack generate
- [ ] OG image: `/api/og/creative/<slug>?format=square`
- [ ] Funnel events appear on admin stats
- [ ] `NEXT_PUBLIC_APP_URL` matches the live domain
- [ ] No `CONTENT_AI_BASE_URL` pointing at localhost
- [ ] Then follow **[LAUNCH.md](LAUNCH.md)** §6 for Meta / UTMs / first £ spend

---

## Quick reference

| Goal | Stages |
|---|---|
| Empty Neon + Vercel smoke deploy (mock data) | 0 → 6 |
| Custom domain | + 7 |
| Real affiliate inventory | + 8 |
| AI captions in prod | + 9 |
| Paid ads readiness | + 10 → [LAUNCH.md](LAUNCH.md) |

## Architecture (what you are wiring)

```text
Browser / ads
    → Vercel (Next.js App Router)
        → Neon Postgres (Prisma)
        → Viator Partner API (optional)
        → OpenAI-compatible content API (optional)
```

SQLite and optional local FreeLLMAPI remain **local development** tools ([SETUP.md](SETUP.md)). Production content AI should be OpenRouter (or OpenAI).
