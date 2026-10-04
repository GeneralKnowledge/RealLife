import Link from "next/link";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/creatives";

export const dynamic = "force-dynamic";

export default async function AdminCreativesPage() {
  const creatives = await prisma.creative.findMany({
    include: { activity: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Creatives</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Ad units generated from activities. Share the creative URL for impressions, or the go link for clicks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {creatives.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No creatives yet. Generate one from{" "}
            <Link href="/admin/activities" className="underline">
              Activities
            </Link>
            .
          </p>
        ) : (
          creatives.map((creative) => (
            <article
              key={creative.id}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
            >
              <div
                className="h-40 bg-cover bg-center"
                style={{ backgroundImage: `url(${creative.imageUrl})` }}
              />
              <div className="space-y-2 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                  {creative.locationLine}
                </p>
                <h3 className="text-lg font-semibold">{creative.headline}</h3>
                <p className="text-sm text-neutral-600">{creative.activity.title}</p>
                <div className="flex flex-wrap gap-3 pt-2 text-sm">
                  <Link href={`/admin/creatives/${creative.slug}`} className="underline">
                    Details
                  </Link>
                  <Link href={`/c/${creative.slug}`} className="underline">
                    Preview ad
                  </Link>
                  <Link href={`/escape/${creative.slug}`} className="underline">
                    Landing
                  </Link>
                </div>
                <p className="break-all text-xs text-neutral-500">
                  Click URL: {appUrl(`/api/go/${creative.slug}`)}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
