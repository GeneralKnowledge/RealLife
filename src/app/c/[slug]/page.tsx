import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackBeacon } from "@/components/TrackBeacon";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CreativePreviewPage({ params }: PageProps) {
  const { slug } = await params;
  const creative = await prisma.creative.findUnique({
    where: { slug },
    include: { activity: true },
  });

  if (!creative) {
    notFound();
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#0b0f0c] px-4 py-10">
      <TrackBeacon
        type="creative_impression"
        creativeId={creative.id}
        activityId={creative.activityId}
      />

      <Link
        href={`/api/go/${creative.slug}`}
        className="group relative block w-full max-w-md overflow-hidden shadow-[var(--shadow)]"
      >
        <div
          className="aspect-[4/5] bg-cover bg-center transition duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${creative.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
          <p className="display text-lg tracking-[0.08em] text-[var(--accent-strong)]">
            GET OUTSIDE
          </p>
          <div className="space-y-3">
            <h1 className="display text-4xl uppercase">{creative.headline}</h1>
            <p className="text-sm text-white/80">{creative.subheadline}</p>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
              {creative.locationLine}
            </p>
            <p className="text-xs uppercase tracking-[0.14em] text-white/70">
              {creative.priceLine}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-[var(--accent)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1a160c]">
              {creative.ctaLabel}
            </span>
          </div>
        </div>
      </Link>
    </main>
  );
}
