import type { Creative, NewsFeedCache, NewsItem, Prisma } from "@prisma/client";
import { prisma } from "./db";
import {
  getNewsProvider,
  type FeedFetchResult,
  type NewsFeedConfig,
  type NewsProvider,
  type NormalizedNewsItem,
} from "./providers/news";

export const THEME_KEYWORDS = [
  "scotland",
  "scottish",
  "highland",
  "highlands",
  "outdoor",
  "outdoors",
  "hike",
  "hiking",
  "trail",
  "trails",
  "walk",
  "walking",
  "climb",
  "climbing",
  "munro",
  "weather",
  "wildlife",
  "coast",
  "coastal",
  "loch",
  "kayak",
  "paddle",
  "camp",
  "camping",
  "nature",
  "national park",
  "glencoe",
  "skye",
  "cairngorm",
  "lomond",
  "hebrid",
  "isle",
  "mountain",
  "mountains",
  "adventure",
  "forest",
] as const;

export type NewsSyncFeedResult = {
  source: string;
  feedUrl: string;
  status: "cache_hit" | "not_modified" | "updated" | "error";
  upserted: number;
  published: number;
  drafted: number;
  expiresAt: string | null;
  error?: string;
};

export type NewsSyncResult = {
  provider: string;
  force: boolean;
  feeds: NewsSyncFeedResult[];
  upserted: number;
};

export function getNewsSyncTtlMs(): number {
  const hours = Number(process.env.NEWS_SYNC_TTL_HOURS ?? 6);
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 6;
  return safeHours * 60 * 60 * 1000;
}

export function isFeedCacheFresh(
  cache: { expiresAt: Date | null; lastStatus: string },
  now: Date,
  force = false,
): boolean {
  if (force) return false;
  if (!cache.expiresAt) return false;
  if (cache.lastStatus === "never" || cache.lastStatus === "error") return false;
  return cache.expiresAt.getTime() > now.getTime();
}

export function matchesThemeKeywords(title: string, summary: string): boolean {
  const haystack = `${title} ${summary}`.toLowerCase();
  return THEME_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

export function extractTags(title: string, summary: string): string[] {
  const haystack = `${title} ${summary}`.toLowerCase();
  return THEME_KEYWORDS.filter((keyword) => haystack.includes(keyword)).slice(0, 8);
}

function parseTags(tags: string): string[] {
  try {
    const parsed: unknown = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function serializeNewsItem(item: NewsItem) {
  return {
    ...item,
    tags: parseTags(item.tags),
  };
}

export type RelatedEscape = {
  slug: string;
  headline: string;
  locationLine: string | null;
};

type CreativeMatch = Pick<Creative, "slug" | "headline" | "locationLine"> & {
  activity: { location: string };
};

export function findRelatedEscape(
  item: { title: string; summary: string; tags?: string[] },
  creatives: CreativeMatch[],
): RelatedEscape | null {
  if (creatives.length === 0) {
    return null;
  }

  const haystack = `${item.title} ${item.summary} ${(item.tags ?? []).join(" ")}`.toLowerCase();
  let best: { creative: CreativeMatch; score: number } | null = null;

  for (const creative of creatives) {
    const location = (creative.locationLine ?? creative.activity.location).toLowerCase();
    const tokens = location
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4);

    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += token.length;
      }
    }
    if (location.length >= 4 && haystack.includes(location)) {
      score += 20;
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { creative, score };
    }
  }

  if (!best) {
    return null;
  }

  return {
    slug: best.creative.slug,
    headline: best.creative.headline,
    locationLine: best.creative.locationLine ?? best.creative.activity.location,
  };
}

async function ensureFeedCache(feed: NewsFeedConfig): Promise<NewsFeedCache> {
  const existing = await prisma.newsFeedCache.findUnique({
    where: { feedUrl: feed.url },
  });
  if (existing) {
    return existing;
  }
  return prisma.newsFeedCache.create({
    data: {
      feedUrl: feed.url,
      source: feed.source,
      lastStatus: "never",
    },
  });
}

export async function upsertNewsItem(item: NormalizedNewsItem): Promise<{
  item: NewsItem;
  published: boolean;
}> {
  const onTheme = matchesThemeKeywords(item.title, item.summary);
  const tags = extractTags(item.title, item.summary);
  const nextStatus = onTheme ? "published" : "draft";

  const existing = await prisma.newsItem.findUnique({
    where: {
      source_externalId: {
        source: item.source,
        externalId: item.externalId,
      },
    },
  });

  if (!existing) {
    const created = await prisma.newsItem.create({
      data: {
        source: item.source,
        externalId: item.externalId,
        title: item.title,
        summary: item.summary,
        url: item.url,
        imageUrl: item.imageUrl,
        publishedAt: item.publishedAt,
        tags: JSON.stringify(tags),
        region: "Scotland",
        status: nextStatus,
      },
    });
    return { item: created, published: nextStatus === "published" };
  }

  const data: Prisma.NewsItemUpdateInput = {
    title: item.title,
    summary: item.summary,
    url: item.url,
    imageUrl: item.imageUrl,
    publishedAt: item.publishedAt,
    tags: JSON.stringify(tags),
  };
  if (existing.status !== "hidden") {
    data.status = nextStatus;
  }

  const updated = await prisma.newsItem.update({
    where: { id: existing.id },
    data,
  });

  return {
    item: updated,
    published: updated.status === "published",
  };
}

async function applyFetchResult(
  feed: NewsFeedConfig,
  cache: NewsFeedCache,
  result: FeedFetchResult,
  ttlMs: number,
): Promise<NewsSyncFeedResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  if (result.kind === "skipped_ttl") {
    return {
      source: feed.source,
      feedUrl: feed.url,
      status: "cache_hit",
      upserted: 0,
      published: 0,
      drafted: 0,
      expiresAt: cache.expiresAt?.toISOString() ?? null,
    };
  }

  if (result.kind === "not_modified") {
    const updated = await prisma.newsFeedCache.update({
      where: { id: cache.id },
      data: {
        etag: result.etag ?? cache.etag,
        lastModified: result.lastModified ?? cache.lastModified,
        fetchedAt: now,
        expiresAt,
        lastStatus: "not_modified",
      },
    });
    return {
      source: feed.source,
      feedUrl: feed.url,
      status: "not_modified",
      upserted: 0,
      published: 0,
      drafted: 0,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
    };
  }

  let upserted = 0;
  let published = 0;
  let drafted = 0;
  for (const item of result.items) {
    const saved = await upsertNewsItem(item);
    upserted += 1;
    if (saved.published) published += 1;
    else drafted += 1;
  }

  const updated = await prisma.newsFeedCache.update({
    where: { id: cache.id },
    data: {
      etag: result.etag ?? cache.etag,
      lastModified: result.lastModified ?? cache.lastModified,
      fetchedAt: now,
      expiresAt,
      lastStatus: "updated",
      rawHash: result.rawHash ?? cache.rawHash,
    },
  });

  return {
    source: feed.source,
    feedUrl: feed.url,
    status: "updated",
    upserted,
    published,
    drafted,
    expiresAt: updated.expiresAt?.toISOString() ?? null,
  };
}

export async function syncNewsFromProvider(options: {
  force?: boolean;
  provider?: NewsProvider;
  now?: Date;
} = {}): Promise<NewsSyncResult> {
  const provider = options.provider ?? getNewsProvider();
  const force = Boolean(options.force);
  const now = options.now ?? new Date();
  const ttlMs = getNewsSyncTtlMs();
  const maxItems = Number(process.env.NEWS_MAX_ITEMS ?? 20);

  const feeds = provider.listFeeds();
  const results: NewsSyncFeedResult[] = [];
  let upsertedTotal = 0;

  for (const feed of feeds) {
    const cache = await ensureFeedCache(feed);

    try {
      if (isFeedCacheFresh(cache, now, force)) {
        const skipped = await applyFetchResult(
          feed,
          cache,
          { kind: "skipped_ttl" },
          ttlMs,
        );
        results.push(skipped);
        continue;
      }

      const fetched = await provider.fetchFeed(feed, {
        etag: cache.etag,
        lastModified: cache.lastModified,
        maxItems: Number.isFinite(maxItems) ? maxItems : 20,
      });

      const applied = await applyFetchResult(feed, cache, fetched, ttlMs);
      results.push(applied);
      upsertedTotal += applied.upserted;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Feed sync failed";
      await prisma.newsFeedCache.update({
        where: { id: cache.id },
        data: { lastStatus: "error" },
      });
      results.push({
        source: feed.source,
        feedUrl: feed.url,
        status: "error",
        upserted: 0,
        published: 0,
        drafted: 0,
        expiresAt: cache.expiresAt?.toISOString() ?? null,
        error: message,
      });
    }
  }

  return {
    provider: provider.name,
    force,
    feeds: results,
    upserted: upsertedTotal,
  };
}

export async function listPublishedNews(limit = 20) {
  const items = await prisma.newsItem.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return items.map(serializeNewsItem);
}

export async function listAdminNews(limit = 100) {
  const items = await prisma.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return items.map(serializeNewsItem);
}

export async function listFeedCaches() {
  return prisma.newsFeedCache.findMany({
    orderBy: { source: "asc" },
  });
}

export async function setNewsItemStatus(
  id: string,
  status: "draft" | "published" | "hidden",
) {
  return prisma.newsItem.update({
    where: { id },
    data: { status },
  });
}

export async function getPublishedCreativesForMatching() {
  return prisma.creative.findMany({
    where: { status: "published" },
    select: {
      slug: true,
      headline: true,
      locationLine: true,
      activity: { select: { location: true } },
    },
  });
}

export async function listPublishedNewsWithRelated(limit = 20) {
  const [items, creatives] = await Promise.all([
    listPublishedNews(limit),
    getPublishedCreativesForMatching(),
  ]);

  return items.map((item) => ({
    ...item,
    relatedEscape: findRelatedEscape(item, creatives),
  }));
}
