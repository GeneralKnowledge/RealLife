import type { Activity as DbActivity, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getActivityProvider, type Activity, type ActivitySearchParams } from "./providers";

export type ActivityFilters = {
  location?: string;
  activityType?: string;
  minPrice?: number;
  maxPrice?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  minRating?: number;
  query?: string;
};

function parseTags(tags: string): string[] {
  try {
    const parsed: unknown = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function serializeActivity(activity: DbActivity) {
  return {
    ...activity,
    tags: parseTags(activity.tags),
  };
}

export async function syncActivitiesFromProvider(
  params: ActivitySearchParams = {},
): Promise<{ upserted: number; provider: string }> {
  const provider = getActivityProvider();
  const results = await provider.searchActivities({
    ...params,
    limit: params.limit ?? 40,
  });

  let upserted = 0;
  for (const activity of results) {
    await upsertActivity(activity);
    upserted += 1;
  }

  return { upserted, provider: provider.name };
}

export async function upsertActivity(activity: Activity): Promise<DbActivity> {
  return prisma.activity.upsert({
    where: {
      provider_externalId: {
        provider: activity.provider,
        externalId: activity.externalId,
      },
    },
    create: {
      provider: activity.provider,
      externalId: activity.externalId,
      title: activity.title,
      description: activity.description,
      shortDescription: activity.shortDescription,
      location: activity.location,
      region: activity.region,
      activityType: activity.activityType,
      priceFrom: activity.priceFrom,
      currency: activity.currency,
      durationMinutes: activity.durationMinutes,
      rating: activity.rating,
      reviewCount: activity.reviewCount ?? 0,
      imageUrl: activity.imageUrl,
      affiliateUrl: activity.affiliateUrl,
      tags: JSON.stringify(activity.tags),
      rawJson: activity.raw ? JSON.stringify(activity.raw) : null,
      syncedAt: new Date(),
    },
    update: {
      title: activity.title,
      description: activity.description,
      shortDescription: activity.shortDescription,
      location: activity.location,
      region: activity.region,
      activityType: activity.activityType,
      priceFrom: activity.priceFrom,
      currency: activity.currency,
      durationMinutes: activity.durationMinutes,
      rating: activity.rating,
      reviewCount: activity.reviewCount ?? 0,
      imageUrl: activity.imageUrl,
      affiliateUrl: activity.affiliateUrl,
      tags: JSON.stringify(activity.tags),
      rawJson: activity.raw ? JSON.stringify(activity.raw) : null,
      syncedAt: new Date(),
    },
  });
}

export async function listActivities(filters: ActivityFilters = {}) {
  const where: Prisma.ActivityWhereInput = {
    region: "Scotland",
  };

  if (filters.location) {
    where.location = { contains: filters.location };
  }
  if (filters.activityType) {
    where.activityType = filters.activityType;
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.priceFrom = {
      gte: filters.minPrice,
      lte: filters.maxPrice,
    };
  }
  if (filters.minDurationMinutes !== undefined || filters.maxDurationMinutes !== undefined) {
    where.durationMinutes = {
      gte: filters.minDurationMinutes,
      lte: filters.maxDurationMinutes,
    };
  }
  if (filters.minRating !== undefined) {
    where.rating = { gte: filters.minRating };
  }
  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query } },
      { description: { contains: filters.query } },
      { location: { contains: filters.query } },
    ];
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
  });

  return activities.map(serializeActivity);
}

export async function getAffiliateRedirectUrl(activityId: string): Promise<string | null> {
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) return null;

  try {
    const provider = getActivityProvider();
    if (provider.name === activity.provider) {
      return provider.getAffiliateUrl({
        provider: activity.provider,
        externalId: activity.externalId,
        title: activity.title,
        description: activity.description,
        shortDescription: activity.shortDescription ?? undefined,
        location: activity.location,
        region: activity.region,
        activityType: activity.activityType,
        priceFrom: activity.priceFrom,
        currency: activity.currency,
        durationMinutes: activity.durationMinutes ?? undefined,
        rating: activity.rating ?? undefined,
        reviewCount: activity.reviewCount,
        imageUrl: activity.imageUrl,
        affiliateUrl: activity.affiliateUrl,
        tags: parseTags(activity.tags),
      });
    }
  } catch {
    // Fall back to cached affiliate URL if live provider is unavailable.
  }

  return activity.affiliateUrl;
}
