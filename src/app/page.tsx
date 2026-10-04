import Link from "next/link";
import { NewsBriefing } from "@/components/NewsBriefing";
import { prisma } from "@/lib/db";
import { listPublishedNewsWithRelated } from "@/lib/news";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [creatives, newsItems] = await Promise.all([
    prisma.creative.findMany({
      where: { status: "published" },
      include: { activity: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    listPublishedNewsWithRelated(5),
  ]);

  const featured = creatives[0];

  return (
    <main>
      <section className="relative min-h-[100svh] overflow-hidden grain">
        <div
          className="absolute inset-0 bg-cover bg-center hero-image"
          style={{
            backgroundImage: `url(${
              featured?.imageUrl ??
              "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=80"
            })`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-[#0f1410]" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-6 pb-16 pt-8">
          <header className="flex items-center justify-between animate-rise">
            <p className="display text-2xl tracking-[0.08em] text-[var(--accent-strong)] md:text-3xl">
              GET OUTSIDE
            </p>
            <div className="flex items-center gap-5">
              <Link
                href="/news"
                className="text-xs uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
              >
                Briefing
              </Link>
              <Link
                href="/admin"
                className="text-xs uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
              >
                Admin
              </Link>
            </div>
          </header>

          <div className="mt-auto max-w-3xl space-y-6 pb-8">
            <h1 className="display animate-rise text-5xl uppercase text-white md:text-7xl lg:text-8xl">
              {featured?.headline ?? "THE INTERNET IS NOT REAL LIFE."}
            </h1>
            <p className="animate-rise-delay max-w-xl text-lg text-white/85 md:text-xl">
              {featured?.subheadline ??
                "Scotland weekends worth leaving the group chat for."}
            </p>
            <div className="animate-rise-late flex flex-wrap items-center gap-4">
              <Link
                href={featured ? `/api/go/${featured.slug}` : "/admin/activities"}
                className="cta-pulse inline-flex items-center rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#1a160c] transition hover:bg-[var(--accent-strong)]"
              >
                {featured?.ctaLabel ?? "PLAN THE ESCAPE"}
              </Link>
              <p className="text-sm uppercase tracking-[0.18em] text-white/70">
                {featured?.locationLine ?? "SCOTLAND"}
                {featured?.priceLine ? ` · ${featured.priceLine}` : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="display text-4xl uppercase md:text-5xl">Escapes ready to book</h2>
          <p className="mt-3 text-[var(--muted)]">
            Targeted outdoor trips with affiliate booking links. Click through and get outside.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {creatives.map((creative, index) => (
            <Link
              key={creative.id}
              href={`/escape/${creative.slug}`}
              className="group block space-y-3"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div
                className="aspect-[4/5] overflow-hidden bg-cover bg-center transition duration-700 group-hover:scale-[1.02]"
                style={{ backgroundImage: `url(${creative.imageUrl})` }}
              />
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                {creative.locationLine}
              </p>
              <h3 className="display text-2xl uppercase">{creative.headline}</h3>
              <p className="text-sm text-[var(--muted)]">{creative.priceLine}</p>
            </Link>
          ))}
        </div>
      </section>

      <NewsBriefing items={newsItems} impressionSurface="home" />
    </main>
  );
}
