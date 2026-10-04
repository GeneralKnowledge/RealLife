import Link from "next/link";
import { GenerateSocialButton } from "@/components/GenerateSocialButton";
import { SocialPostCard } from "@/components/SocialPostCard";
import { getContentAiConfig, isContentAiEnabled } from "@/lib/content-ai";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSocialPage() {
  const creatives = await prisma.creative.findMany({
    where: { status: "published" },
    include: {
      activity: true,
      socialPosts: { orderBy: { platform: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalPosts = creatives.reduce((sum, creative) => sum + creative.socialPosts.length, 0);
  const aiEnabled = isContentAiEnabled();
  const aiConfig = getContentAiConfig();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Social content</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Auto-generated captions and visual packs for Instagram, Stories, X, Facebook, and TikTok.
            {` ${totalPosts} posts ready.`}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            {aiEnabled
              ? `Content AI on · ${aiConfig.model} via ${aiConfig.baseURL}`
              : "Content AI off · using templates. Set CONTENT_AI_BASE_URL to point at your OpenAI-compatible API."}
          </p>
        </div>
        <Link href="/admin/activities" className="text-sm underline">
          Generate from an activity →
        </Link>
      </div>

      {creatives.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No creatives yet. Create one from{" "}
          <Link href="/admin/activities" className="underline">
            Activities
          </Link>
          .
        </p>
      ) : (
        creatives.map((creative) => (
          <section key={creative.id} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{creative.headline}</h3>
                <p className="text-sm text-neutral-600">
                  {creative.activity.location} · {creative.activity.title}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/admin/creatives/${creative.slug}`}
                  className="text-sm underline"
                >
                  Creative details
                </Link>
                <GenerateSocialButton
                  creativeId={creative.id}
                  label={
                    creative.socialPosts.length > 0
                      ? "Regenerate pack"
                      : "Generate social pack"
                  }
                />
              </div>
            </div>

            {creative.socialPosts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-6 text-sm text-neutral-500">
                No social posts yet for this creative.
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
        ))
      )}
    </div>
  );
}
