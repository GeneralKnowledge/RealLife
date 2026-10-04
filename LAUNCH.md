# Get Outside — Launch Checklist

Use this to go from local MVP to a real Scotland ads test.
Success metric: **landing → affiliate click rate** (and paid CPA to outbound click).

For first-time local install, start with **[SETUP.md](SETUP.md)**.

## 1. Accounts to open

### Must-have
| Account | Action | Env / output |
|---|---|---|
| [Viator Affiliate](https://partners.viator.com) | Sign up (Basic API is enough). Copy API key + affiliate PID. | `VIATOR_API_KEY`, `VIATOR_AFFILIATE_ID`, `ACTIVITY_PROVIDER=viator` |
| Domain (Cloudflare / Porkbun / Namecheap) | Buy from the shortlist below. Point DNS to Vercel. | `NEXT_PUBLIC_APP_URL=https://your-domain` |
| [Vercel](https://vercel.com) | Import this repo, set env vars, deploy. | Hosting |
| [Neon](https://neon.tech) or [Supabase](https://supabase.com) Postgres | Create a free project DB. | `DATABASE_URL` (Postgres) |
| [Meta Business](https://business.facebook.com) | Ad account for IG/FB image ads. | Paid traffic |
| [PostHog](https://posthog.com) (preferred) or GA4 | Product + UTM funnels. | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |

### Strongly recommended
| Account | Why |
|---|---|
| Cloudflare | DNS + CDN in front of Vercel |
| TikTok Ads | Second creative channel (captions already generated) |
| Sentry | Error monitoring on redirects |
| Licensed stock / own photos | Unsplash is fine for demos; confirm commercial rights before scale |

### Skip for now
Stripe, Clerk/Auth0 product auth, Viator Full+Booking on-site checkout, multi-provider networks.

## 2. Domain shortlist

Brand-first (preferred):
- `getoutside.co.uk` / `getoutside.scot`
- `getout.scot` / `go-outside.co.uk`

Provocative (great for ads, weaker trust):
- `notreal.life` / `internetisnot.life`

Intent / CTA:
- `escape.scot` / `planescape.co.uk` / `outthisweekend.co.uk`

After purchase, set:
```bash
NEXT_PUBLIC_APP_URL=https://your-domain
```

Tracked ad URLs:
- Creative click: `https://your-domain/api/go/<slug>?utm_source=meta&utm_medium=paid&utm_campaign=<name>`
- Landing: `https://your-domain/escape/<slug>`
- Ad preview: `https://your-domain/c/<slug>`

## 3. Production env template

```bash
# App
NEXT_PUBLIC_APP_URL=https://your-domain
ADMIN_TOKEN=<long-random-secret>

# Database (Neon/Supabase). Switch prisma schema provider to postgresql first.
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Provider
ACTIVITY_PROVIDER=viator
VIATOR_API_KEY=
VIATOR_API_BASE_URL=https://api.viator.com/partner
VIATOR_AFFILIATE_ID=
VIATOR_DESTINATION_ID=22

# Optional analytics / ads
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_META_PIXEL_ID=

# Content AI — local FreeLLMAPI for cheap tests; paid OpenAI/OpenRouter in prod if you prefer
CONTENT_AI_BASE_URL=http://127.0.0.1:3001/v1
CONTENT_AI_API_KEY=freellmapi-...
CONTENT_AI_MODEL=auto:cheap
CONTENT_AI_STRUCTURED_OUTPUTS=false
```

Local FreeLLMAPI bootstrap: `pnpm llm:setup` (see README). Do not expose FreeLLMAPI publicly in production — run it on a private host or swap to a managed API.

## 4. Deploy (Vercel + Postgres)

1. Create Neon/Supabase Postgres and copy `DATABASE_URL`.
2. In [`prisma/schema.prisma`](prisma/schema.prisma), set:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   (Local default remains `sqlite` until you switch.)
3. Run migrations against Postgres:
   ```bash
   pnpm exec prisma migrate deploy
   pnpm db:seed   # optional sample Scotland data; or sync from Viator in admin
   ```
4. Import the GitHub repo into Vercel.
5. Add all env vars from the template.
6. Deploy. Confirm `/`, `/admin`, and `/escape/<slug>` work on the custom domain.

Local Postgres alternative:
```bash
docker compose up -d
# then point DATABASE_URL at localhost and use provider = postgresql
```

## 5. OSS upgrades we lean on

| Need | Building block |
|---|---|
| Composited ad / OG images | `next/og` (`ImageResponse`) — see `/api/og/creative/[slug]` |
| AI captions / headlines | [Vercel AI SDK](https://github.com/vercel/ai) + `@ai-sdk/openai-compatible` (point `CONTENT_AI_BASE_URL` at your API) |
| Admin session | httpOnly cookie (no token in client HTML) |
| Product analytics | [PostHog JS](https://github.com/PostHog/posthog-js) (optional env) |
| CI | GitHub Actions — `.github/workflows/ci.yml` |

## 6. Pre-paid-traffic checklist

- [ ] Viator keys live; sync Scotland activities in admin
- [ ] Domain + `NEXT_PUBLIC_APP_URL` set
- [ ] Postgres + Vercel deploy green
- [ ] `ADMIN_TOKEN` changed from default; admin login works
- [ ] OG/ad images render (`/api/og/creative/<slug>?format=square`)
- [ ] Download ad pack from creative detail
- [ ] UTM’d `/api/go/<slug>` links used in Meta
- [ ] Funnel shows impressions → clicks → landing → affiliate
- [ ] First small Meta test (£50–100) against 1–2 Scotland escapes

## 7. What not to build yet

Full marketplace, user accounts, payments, on-site booking, multi-region catalog, recommendation engines, social auto-posting APIs.
