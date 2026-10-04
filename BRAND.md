# Get Outside — Brand Guide

A short reference so creatives, landing pages, ads, and social stay on one theme.

**Promise:** Get people off the feed and into a bookable Scotland outdoor escape.

---

## Name & lockup

| Use | Form |
|---|---|
| Product name | Get Outside |
| Display / hero brand | `GET OUTSIDE` (all caps, display font) |
| Hashtag | `#GetOutside` |
| Domains (preferred) | `getoutside.co.uk`, `getoutside.scot`, `getout.scot` |

Brand is the hero signal on every public surface. Don’t bury it as a tiny nav label or eyebrow.

---

## Central theme

**The internet is not real life.**

We sell the tension between screen life and outdoors — then resolve it with a real, bookable trip in Scotland.

Core idea in one line:

> Close the tabs. Book the hills.

Market focus for this MVP: **Scotland weekends and day escapes** (hiking, kayak, wildlife, whisky walks, coast).

---

## Voice

**Tone:** blunt, restless, slightly cheeky — never corporate travel brochure, never wellness fluff.

| Do | Don’t |
|---|---|
| Short punches. Imperatives. | Soft SEO filler (“discover breathtaking…”) |
| Contrast screen vs outdoors | Shame users or lecture them |
| Specific place + price signal | Vague “adventure awaits” |
| Sound like a friend who already booked | Sound like a tour operator FAQ |

### Headline bank (canonical energy)

Use these as the bar for new copy (see also `src/lib/creatives.ts`):

- THE INTERNET IS NOT REAL LIFE.
- YOUR BED HAS SEEN ENOUGH OF YOU.
- CLOSE THE TABS. OPEN THE MAP.
- THE OUTDOORS DOESN'T NEED A PASSWORD.
- SCROLL LESS. STRIDE MORE.
- YOUR CALENDAR CAN WAIT.
- LEAVE THE GROUP CHAT BEHIND.
- THE MOUNTAINS DON'T CARE ABOUT YOUR INBOX.

Headlines: **ALL CAPS**, display type, one idea. Prefer period endings.

### Subheads

One sentence. Place + motive.

Pattern: `Get out of the routine. {Location} is waiting.`

Also fine: `Scotland weekends worth leaving the group chat for.`

### CTAs

Primary: **PLAN THE ESCAPE**

Alternates (same energy): `Book this escape`, `Get outside`, swipe/tap link language for stories.

Avoid: `Learn more`, `Shop now`, `Submit`, `Explore packages`.

---

## Visual system

Source of truth: `src/app/globals.css` + fonts in `src/app/layout.tsx`.

### Colour

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0f1410` | Page / night forest base |
| `--bg-elevated` | `#1a221c` | Raised surfaces |
| `--fg` | `#f2efe6` | Primary text |
| `--muted` | `#b7c0b4` | Secondary text |
| `--accent` | `#c6a15b` | CTA gold |
| `--accent-strong` | `#e0c07a` | Brand wordmark / hover |
| `--success` | `#7d9b76` | Positive status |
| `--danger` | `#c97b6a` | Errors |

Atmosphere: dark moss + gold, soft radial glows, light film grain (`.grain`). Not flat black, not purple neon, not cream-serif travel magazine.

Admin UI may use the light shell (`.admin-shell`) — that is **tooling**, not brand.

### Type

| Role | Font | Notes |
|---|---|---|
| Display / brand / headlines | **Archivo Black** | Tight leading (~0.95), slight tracking, uppercase |
| Body / UI | **Manrope** | Readable, calm contrast to display |

### Imagery

- Full-bleed place photography: Highlands, lochs, ridgelines, coast, weather.
- Hero is edge-to-edge. Overlay with dark gradients for type contrast.
- Slow ken-burns on heroes is on-brand; keep motion calm (rise-in, pulse CTA).
- No collage grids, floating promo badges, or sticker chips on hero media.
- Prefer real Scotland atmosphere over stock “generic mountain selfie.”

### Layout rules (public pages)

1. First viewport = one composition: brand, one headline, one subhead, one CTA group, one dominant image.
2. No cards in the hero. Downstream listings can be simple image + type blocks (borders/shadows only if they help interaction).
3. One job per section.
4. Location line + price line in uppercase tracking — metadata, not competing headlines.

---

## Social & ads

Keep the same provocation → place → price → link path.

| Platform | Notes |
|---|---|
| Instagram feed | Headline + subhead + price; hashtags include `#GetOutside` `#Scotland` `#WeekendEscape` |
| Story / TikTok | Ultra short; place UPPERCASE; clear tap/swipe CTA |
| X | Tight; “Get outside → {link}` |
| Meta image ads | Use composited OG creatives (`/api/og/creative/...`); brand mark top-left; gold CTA pill |

UTM campaign default energy: `scotland-escapes`.

Provocation domains (`notreal.life`, etc.) can work for ads — still land on Get Outside visual + voice so trust holds on the escape page.

---

## What we are / aren’t

**We are:** a shove outdoors + a clear booking handoff.

**We aren’t:** a marketplace, a guidebook, a wellness brand, or a generic “travel inspo” account.

If a line could sit on any outdoor brand after you remove “Scotland” and the screen-life jab, rewrite it.

---

## Quick checklist

- [ ] `GET OUTSIDE` visible as brand, not decoration
- [ ] Headline punches screen-vs-real-life (or equal energy)
- [ ] Scotland place named; price or “from” when we have it
- [ ] CTA is escape/book language
- [ ] Dark forest + gold; Archivo Black + Manrope
- [ ] Full-bleed real place image; no hero clutter
- [ ] Affiliate path obvious — we send people out to book
