import { prisma } from "./db";

export type EventType =
  | "creative_impression"
  | "creative_click"
  | "landing_view"
  | "affiliate_click";

export async function trackEvent(input: {
  type: EventType;
  creativeId?: string;
  activityId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await prisma.event.create({
    data: {
      type: input.type,
      creativeId: input.creativeId,
      activityId: input.activityId,
      meta: input.meta ? JSON.stringify(input.meta) : null,
    },
  });
}

export type FunnelStats = {
  creativeImpressions: number;
  creativeClicks: number;
  landingViews: number;
  affiliateClicks: number;
  clickThroughRate: number;
  landingConversionRate: number;
  affiliateConversionRate: number;
  byCreative: Array<{
    creativeId: string;
    slug: string;
    headline: string;
    impressions: number;
    clicks: number;
    landingViews: number;
    affiliateClicks: number;
  }>;
};

export async function getFunnelStats(): Promise<FunnelStats> {
  const [counts, creatives, events] = await Promise.all([
    prisma.event.groupBy({
      by: ["type"],
      _count: { _all: true },
    }),
    prisma.creative.findMany({
      select: { id: true, slug: true, headline: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.findMany({
      where: { creativeId: { not: null } },
      select: { type: true, creativeId: true },
    }),
  ]);

  const countMap = Object.fromEntries(counts.map((row) => [row.type, row._count._all]));

  const creativeImpressions = countMap.creative_impression ?? 0;
  const creativeClicks = countMap.creative_click ?? 0;
  const landingViews = countMap.landing_view ?? 0;
  const affiliateClicks = countMap.affiliate_click ?? 0;

  const byCreative = creatives.map((creative) => {
    const related = events.filter((event) => event.creativeId === creative.id);
    return {
      creativeId: creative.id,
      slug: creative.slug,
      headline: creative.headline,
      impressions: related.filter((event) => event.type === "creative_impression").length,
      clicks: related.filter((event) => event.type === "creative_click").length,
      landingViews: related.filter((event) => event.type === "landing_view").length,
      affiliateClicks: related.filter((event) => event.type === "affiliate_click").length,
    };
  });

  return {
    creativeImpressions,
    creativeClicks,
    landingViews,
    affiliateClicks,
    clickThroughRate: creativeImpressions === 0 ? 0 : creativeClicks / creativeImpressions,
    landingConversionRate: creativeClicks === 0 ? 0 : landingViews / creativeClicks,
    affiliateConversionRate: landingViews === 0 ? 0 : affiliateClicks / landingViews,
    byCreative,
  };
}
