import { createHash } from "node:crypto";
import Parser from "rss-parser";
import type {
  FeedFetchOptions,
  FeedFetchResult,
  NewsFeedConfig,
  NewsProvider,
  NormalizedNewsItem,
} from "./types";

type RssItem = {
  guid?: string;
  id?: string;
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  isoDate?: string;
  pubDate?: string;
  enclosure?: { url?: string };
  "media:content"?: { $?: { url?: string } };
  "media:thumbnail"?: { $?: { url?: string } };
};

const parser = new Parser({
  timeout: 15_000,
  customFields: {
    item: ["media:content", "media:thumbnail"],
  },
});

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRssFeedsEnv(raw: string | undefined): NewsFeedConfig[] {
  if (!raw || raw.trim() === "") {
    return [
      {
        url: "https://feeds.bbci.co.uk/news/scotland/rss.xml",
        source: "bbc-scotland",
      },
      {
        url: "https://www.theguardian.com/uk/scotland/rss",
        source: "guardian-scotland",
      },
    ];
  }

  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [url, source] = part.split("|").map((piece) => piece.trim());
      if (!url) {
        throw new Error(`Invalid NEWS_RSS_FEEDS entry: ${part}`);
      }
      const derived =
        source ||
        new URL(url).hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-");
      return { url, source: derived.toLowerCase() };
    });
}

function imageFromItem(item: RssItem): string | undefined {
  const candidates = [
    item.enclosure?.url,
    item["media:content"]?.$?.url,
    item["media:thumbnail"]?.$?.url,
  ];
  for (const candidate of candidates) {
    if (candidate && /^https?:\/\//i.test(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

export function normalizeRssItem(
  item: RssItem,
  source: string,
): NormalizedNewsItem | null {
  const title = stripHtml(item.title ?? "");
  const url = (item.link ?? "").trim();
  if (!title || !url) {
    return null;
  }

  const externalId = stripHtml(item.guid ?? item.id ?? url);
  const summary = stripHtml(item.contentSnippet ?? item.summary ?? item.content ?? "").slice(
    0,
    600,
  );
  const publishedAt = item.isoDate
    ? new Date(item.isoDate)
    : item.pubDate
      ? new Date(item.pubDate)
      : new Date();

  return {
    source,
    externalId,
    title,
    summary,
    url,
    imageUrl: imageFromItem(item),
    publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
    tags: [],
  };
}

export async function parseRssXmlAsync(
  xml: string,
  source: string,
  maxItems = 20,
): Promise<NormalizedNewsItem[]> {
  const feed = await parser.parseString(xml);
  const items: NormalizedNewsItem[] = [];
  for (const raw of feed.items ?? []) {
    const normalized = normalizeRssItem(raw as RssItem, source);
    if (normalized) {
      items.push(normalized);
    }
    if (items.length >= maxItems) break;
  }
  return items;
}

type FetchLike = (
  input: string,
  init?: {
    headers?: Record<string, string>;
    signal?: AbortSignal;
  },
) => Promise<{
  status: number;
  ok: boolean;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}>;

export class RssNewsProvider implements NewsProvider {
  readonly name = "rss";
  private readonly feeds: NewsFeedConfig[];
  private readonly fetchImpl: FetchLike;

  constructor(
    feeds: NewsFeedConfig[] = parseRssFeedsEnv(process.env.NEWS_RSS_FEEDS),
    fetchImpl: FetchLike = fetch as FetchLike,
  ) {
    this.feeds = feeds;
    this.fetchImpl = fetchImpl;
  }

  listFeeds(): NewsFeedConfig[] {
    return this.feeds;
  }

  async fetchFeed(
    feed: NewsFeedConfig,
    options: FeedFetchOptions = {},
  ): Promise<FeedFetchResult> {
    const headers: Record<string, string> = {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      "User-Agent": "GetOutsideNewsBot/1.0 (+https://getoutside.local)",
    };
    if (options.etag) {
      headers["If-None-Match"] = options.etag;
    }
    if (options.lastModified) {
      headers["If-Modified-Since"] = options.lastModified;
    }

    const response = await this.fetchImpl(feed.url, { headers });

    if (response.status === 304) {
      return {
        kind: "not_modified",
        etag: response.headers.get("etag") ?? options.etag ?? undefined,
        lastModified:
          response.headers.get("last-modified") ?? options.lastModified ?? undefined,
      };
    }

    if (!response.ok) {
      throw new Error(`RSS fetch failed for ${feed.source}: HTTP ${response.status}`);
    }

    const xml = await response.text();
    const maxItems = options.maxItems ?? Number(process.env.NEWS_MAX_ITEMS ?? 20);
    const items = await parseRssXmlAsync(xml, feed.source, maxItems);
    const rawHash = createHash("sha256").update(xml).digest("hex").slice(0, 32);

    return {
      kind: "items",
      items,
      etag: response.headers.get("etag") ?? undefined,
      lastModified: response.headers.get("last-modified") ?? undefined,
      rawHash,
    };
  }
}
