import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerateSocialButton } from "@/components/GenerateSocialButton";
import { SocialPostCard } from "@/components/SocialPostCard";
import { getExpectedAdminToken } from "@/lib/admin";
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
    include: {
      activity: true,
      events: true,
      socialPosts: { orderBy: { platform: "asc" } },
    },
  });

  if (!creative) {
    notFound();
  }

  const adminToken = getExpectedAdminToken();
  const counts = {
    impressions: creative.events.filter((event) => event.type === "creative_impression").length,
    clicks: creative.events.filter((event) => event.type === "creative_click").length,
    landing: creative.events.filter((event) => event.type === "landing_view").length,
    affiliate: creative.events.filter((event) => event.type === "affiliate_click").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/creatives" className="text-sm text-neutral-500 underline">
            ← Creatives
          </Link>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{creative.headline}</h2>
          <p className="text-sm text-neutral-600">{creative.activity.title}</p>
        </div>
        <GenerateSocialButton
          adminToken={adminToken}
          creativeId={creative.id}
          label={creative.socialPosts.length > 0 ? "Regenerate social pack" : "Generate social pack"}
        />
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

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Social pack</h3>
          <Link href="/admin/social" className="text-sm underline">
            All social content
          </Link>
        </div>
        {creative.socialPosts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-6 text-sm text-neutral-500">
            No social posts yet. Generate a pack to get Instagram, X, Facebook, and TikTok copy.
          </p>
        ) : (
          <div className="grid gap-4">
            {creative.socialPosts.map((post) => (
              <SocialPostCard
                key={post.id}
                platform={post.platform}
                format={post.format}
                caption={post.caption}
                hashtags={post.hashtags}
                ctaLabel={post.ctaLabel}
                ctaUrl={post.ctaUrl}
                imageUrl={post.imageUrl}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
