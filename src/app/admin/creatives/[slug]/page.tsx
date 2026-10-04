import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/creatives";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AdminCreativeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const creative = await prisma.creative.findUnique({
    where: { slug },
    include: { activity: true, events: true },
  });

  if (!creative) {
    notFound();
  }

  const counts = {
    impressions: creative.events.filter((event) => event.type === "creative_impression").length,
    clicks: creative.events.filter((event) => event.type === "creative_click").length,
    landing: creative.events.filter((event) => event.type === "landing_view").length,
    affiliate: creative.events.filter((event) => event.type === "affiliate_click").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/creatives" className="text-sm text-neutral-500 underline">
          ← Creatives
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{creative.headline}</h2>
        <p className="text-sm text-neutral-600">{creative.activity.title}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div
          className="min-h-80 rounded-xl bg-cover bg-center"
          style={{ backgroundImage: `url(${creative.imageUrl})` }}
        />
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-neutral-500">Subheadline</dt>
              <dd>{creative.subheadline}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Location</dt>
              <dd>{creative.locationLine}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Price line</dt>
              <dd>{creative.priceLine}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">CTA</dt>
              <dd>{creative.ctaLabel}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Ad preview URL</dt>
              <dd className="break-all">{appUrl(`/c/${creative.slug}`)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Click-through URL</dt>
              <dd className="break-all">{appUrl(`/api/go/${creative.slug}`)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Landing URL</dt>
              <dd className="break-all">{appUrl(`/escape/${creative.slug}`)}</dd>
            </div>
          </dl>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Impressions</p>
              <p className="text-xl font-semibold">{counts.impressions}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Clicks</p>
              <p className="text-xl font-semibold">{counts.clicks}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Landing</p>
              <p className="text-xl font-semibold">{counts.landing}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Affiliate</p>
              <p className="text-xl font-semibold">{counts.affiliate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
