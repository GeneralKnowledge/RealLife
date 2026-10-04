import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackBeacon } from "@/components/TrackBeacon";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function EscapePage({ params }: PageProps) {
  const { slug } = await params;
  const creative = await prisma.creative.findUnique({
    where: { slug },
    include: { activity: true },
  });

  if (!creative || creative.status !== "published") {
    notFound();
  }

  const { activity } = creative;
  const bookHref = `/api/affiliate/${activity.id}?creativeId=${creative.id}`;

  return (
    <main className="relative min-h-[100svh] overflow-hidden grain">
      <TrackBeacon
        type="landing_view"
        creativeId={creative.id}
        activityId={activity.id}
      />

      <div
        className="absolute inset-0 bg-cover bg-center hero-image"
        style={{ backgroundImage: `url(${creative.imageUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-6 pb-12 pt-8">
        <header className="flex items-center justify-between animate-rise">
          <Link href="/" className="display text-2xl tracking-[0.08em] text-[var(--accent-strong)]">
            GET OUTSIDE
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Scotland</p>
        </header>

        <div className="mt-auto grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="max-w-3xl space-y-5">
            <p className="animate-rise text-sm uppercase tracking-[0.22em] text-[var(--accent)]">
              {creative.locationLine}
            </p>
            <h1 className="display animate-rise text-5xl uppercase text-white md:text-7xl">
              {creative.headline}
            </h1>
            <p className="animate-rise-delay max-w-xl text-lg text-white/85">
              {creative.subheadline}
            </p>
            <p className="animate-rise-delay text-sm uppercase tracking-[0.16em] text-white/70">
              {creative.priceLine}
            </p>
            <div className="animate-rise-late flex flex-wrap gap-4 pt-2">
              <a
                href={bookHref}
                className="cta-pulse inline-flex items-center rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#1a160c] transition hover:bg-[var(--accent-strong)]"
              >
                {creative.ctaLabel}
              </a>
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm uppercase tracking-[0.14em] text-white/85 transition hover:border-white hover:text-white"
              >
                More escapes
              </Link>
            </div>
          </div>

          <aside className="animate-rise-late space-y-4 border-t border-white/20 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <h2 className="display text-3xl uppercase text-white">{activity.title}</h2>
            <p className="text-sm leading-relaxed text-white/80">
              {activity.shortDescription ?? activity.description.slice(0, 220)}
            </p>
            <dl className="grid grid-cols-2 gap-3 text-sm text-white/75">
              <div>
                <dt className="uppercase tracking-[0.14em] text-white/45">From</dt>
                <dd>{formatMoney(activity.priceFrom, activity.currency)}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.14em] text-white/45">Type</dt>
                <dd className="capitalize">{activity.activityType.replace("-", " ")}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.14em] text-white/45">Rating</dt>
                <dd>
                  {activity.rating ? `${activity.rating.toFixed(1)} / 5` : "New"}
                  {activity.reviewCount ? ` · ${activity.reviewCount}` : ""}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.14em] text-white/45">Duration</dt>
                <dd>
                  {activity.durationMinutes
                    ? `${Math.round(activity.durationMinutes / 60)} hrs`
                    : "Flexible"}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-white/45">
              Booking continues on our affiliate partner. We may earn a commission.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
