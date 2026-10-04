import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  findRelatedEscape,
  isFeedCacheFresh,
  matchesThemeKeywords,
  syncNewsFromProvider,
} from "./news";
import { RssNewsProvider, parseRssFeedsEnv, parseRssXmlAsync, stripHtml } from "./providers/news";
import type { NewsProvider } from "./providers/news";

const sampleRss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Scotland outdoors</title>
    <item>
      <title>Hiking the Cairngorms in autumn</title>
      <link>https://example.com/cairngorms-hike</link>
      <guid>cairngorms-hike</guid>
      <description>Trail notes for a Scotland outdoor weekend.</description>
      <pubDate>Wed, 01 Oct 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>City council parking update</title>
      <link>https://example.com/parking</link>
      <guid>parking</guid>
      <description>Urban admin news with no hills.</description>
      <pubDate>Wed, 01 Oct 2026 11:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

vi.mock("./db", () => {
  const newsItems = new Map<string, Record<string, unknown>>();
  const caches = new Map<string, Record<string, unknown>>();

  return {
    prisma: {
      newsFeedCache: {
        findUnique: vi.fn(async ({ where }: { where: { feedUrl: string } }) => {
          return caches.get(where.feedUrl) ?? null;
        }),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const row = {
            id: `cache_${caches.size + 1}`,
            etag: null,
            lastModified: null,
            fetchedAt: null,
            expiresAt: null,
            rawHash: null,
            ...data,
          };
          caches.set(String(data.feedUrl), row);
          return row;
        }),
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => {
            for (const [url, row] of caches.entries()) {
              if (row.id === where.id) {
                const next = { ...row, ...data };
                caches.set(url, next);
                return next;
              }
            }
            throw new Error("cache missing");
          },
        ),
      },
      newsItem: {
        findUnique: vi.fn(
          async ({
            where,
          }: {
            where: { source_externalId: { source: string; externalId: string } };
          }) => {
            const key = `${where.source_externalId.source}:${where.source_externalId.externalId}`;
            return newsItems.get(key) ?? null;
          },
        ),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: `news_${newsItems.size + 1}`, ...data };
          newsItems.set(`${data.source}:${data.externalId}`, row);
          return row;
        }),
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => {
            for (const [key, row] of newsItems.entries()) {
              if (row.id === where.id) {
                const next = { ...row, ...data };
                newsItems.set(key, next);
                return next;
              }
            }
            throw new Error("item missing");
          },
        ),
      },
    },
    __resetNewsMocks: () => {
      newsItems.clear();
      caches.clear();
    },
  };
});

describe("news helpers", () => {
  it("strips html and normalizes rss items", async () => {
    expect(stripHtml("<p>Hello &amp; hills</p>")).toBe("Hello & hills");
    const items = await parseRssXmlAsync(sampleRss, "fixture", 10);
    expect(items).toHaveLength(2);
    expect(items[0]?.title).toContain("Cairngorms");
    expect(items[0]?.externalId).toBe("cairngorms-hike");
  });

  it("parses NEWS_RSS_FEEDS env", () => {
    const feeds = parseRssFeedsEnv(
      "https://feeds.bbci.co.uk/news/scotland/rss.xml|bbc-scotland,https://www.ukhillwalking.com/rss.xml|ukhillwalking",
    );
    expect(feeds).toHaveLength(2);
    expect(feeds[0]?.source).toBe("bbc-scotland");
  });

  it("matches theme keywords and related escapes", () => {
    expect(matchesThemeKeywords("Glencoe hiking weekend", "")).toBe(true);
    expect(matchesThemeKeywords("Parking charges rise", "city centre")).toBe(false);

    const related = findRelatedEscape(
      {
        title: "Calm morning paddles on Loch Lomond",
        summary: "Wildlife and kayaks around the loch.",
      },
      [
        {
          slug: "loch-lomond-escape",
          headline: "YOUR BED HAS SEEN ENOUGH OF YOU.",
          locationLine: "LOCH LOMOND",
          activity: { location: "Loch Lomond" },
        },
        {
          slug: "glencoe-escape",
          headline: "CLOSE THE TABS. OPEN THE MAP.",
          locationLine: "GLENCOE",
          activity: { location: "Glencoe" },
        },
      ],
    );
    expect(related?.slug).toBe("loch-lomond-escape");
  });

  it("treats feed cache TTL as fresh unless forced", () => {
    const now = new Date("2026-10-04T12:00:00.000Z");
    expect(
      isFeedCacheFresh(
        {
          expiresAt: new Date("2026-10-04T18:00:00.000Z"),
          lastStatus: "updated",
        },
        now,
        false,
      ),
    ).toBe(true);
    expect(
      isFeedCacheFresh(
        {
          expiresAt: new Date("2026-10-04T18:00:00.000Z"),
          lastStatus: "updated",
        },
        now,
        true,
      ),
    ).toBe(false);
    expect(
      isFeedCacheFresh(
        {
          expiresAt: new Date("2026-10-04T10:00:00.000Z"),
          lastStatus: "updated",
        },
        now,
        false,
      ),
    ).toBe(false);
  });
});

describe("RssNewsProvider conditional fetch", () => {
  it("returns not_modified on HTTP 304", async () => {
    const fetchImpl = vi.fn(async () => ({
      status: 304,
      ok: false,
      headers: {
        get: (name: string) => (name.toLowerCase() === "etag" ? '"abc"' : null),
      },
      text: async () => "",
    }));

    const provider = new RssNewsProvider(
      [{ url: "https://example.com/feed.xml", source: "example" }],
      fetchImpl,
    );

    const result = await provider.fetchFeed(
      { url: "https://example.com/feed.xml", source: "example" },
      { etag: '"abc"' },
    );

    expect(result.kind).toBe("not_modified");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("parses items on HTTP 200", async () => {
    const fetchImpl = vi.fn(async () => ({
      status: 200,
      ok: true,
      headers: {
        get: (name: string) => (name.toLowerCase() === "etag" ? '"v2"' : null),
      },
      text: async () => sampleRss,
    }));

    const provider = new RssNewsProvider(
      [{ url: "https://example.com/feed.xml", source: "example" }],
      fetchImpl,
    );

    const result = await provider.fetchFeed({
      url: "https://example.com/feed.xml",
      source: "example",
    });

    expect(result.kind).toBe("items");
    if (result.kind === "items") {
      expect(result.items.length).toBe(2);
      expect(result.etag).toBe('"v2"');
    }
  });
});

describe("syncNewsFromProvider TTL", () => {
  beforeEach(async () => {
    const mod = await import("./db");
    (mod as unknown as { __resetNewsMocks: () => void }).__resetNewsMocks?.();
    vi.clearAllMocks();
  });

  it("skips network when cache TTL is fresh, and fetches when forced", async () => {
    const fetchFeed = vi.fn(async () => ({
      kind: "items" as const,
      items: [
        {
          source: "fixture",
          externalId: "one",
          title: "Scotland hiking update",
          summary: "Outdoor trail news",
          url: "https://example.com/one",
          publishedAt: new Date("2026-10-01T00:00:00.000Z"),
          tags: ["scotland", "hiking"],
        },
      ],
      etag: '"1"',
      lastModified: "Wed, 01 Oct 2026 00:00:00 GMT",
      rawHash: "abc",
    }));

    const provider: NewsProvider = {
      name: "fixture",
      listFeeds: () => [{ url: "https://example.com/feed.xml", source: "fixture" }],
      fetchFeed,
    };

    const first = await syncNewsFromProvider({
      provider,
      force: true,
      now: new Date("2026-10-04T12:00:00.000Z"),
    });
    expect(first.feeds[0]?.status).toBe("updated");
    expect(fetchFeed).toHaveBeenCalledTimes(1);

    const second = await syncNewsFromProvider({
      provider,
      force: false,
      now: new Date("2026-10-04T12:30:00.000Z"),
    });
    expect(second.feeds[0]?.status).toBe("cache_hit");
    expect(fetchFeed).toHaveBeenCalledTimes(1);

    const forced = await syncNewsFromProvider({
      provider,
      force: true,
      now: new Date("2026-10-04T12:45:00.000Z"),
    });
    expect(forced.feeds[0]?.status).toBe("updated");
    expect(fetchFeed).toHaveBeenCalledTimes(2);
  });

  it("on 304 only refreshes expiry metadata", async () => {
    const fetchFeed = vi
      .fn()
      .mockResolvedValueOnce({
        kind: "items" as const,
        items: [
          {
            source: "fixture",
            externalId: "one",
            title: "Scotland wildlife walk",
            summary: "Outdoor coast notes",
            url: "https://example.com/one",
            publishedAt: new Date("2026-10-01T00:00:00.000Z"),
            tags: ["scotland", "wildlife"],
          },
        ],
        etag: '"1"',
      })
      .mockResolvedValueOnce({
        kind: "not_modified" as const,
        etag: '"1"',
      });

    const provider: NewsProvider = {
      name: "fixture",
      listFeeds: () => [{ url: "https://example.com/feed.xml", source: "fixture" }],
      fetchFeed,
    };

    await syncNewsFromProvider({
      provider,
      force: true,
      now: new Date("2026-10-04T12:00:00.000Z"),
    });

    // Expire TTL, then sync again for 304 path
    const { prisma } = await import("./db");
    const cache = await prisma.newsFeedCache.findUnique({
      where: { feedUrl: "https://example.com/feed.xml" },
    });
    await prisma.newsFeedCache.update({
      where: { id: cache!.id },
      data: { expiresAt: new Date("2026-10-04T11:00:00.000Z") },
    });

    const result = await syncNewsFromProvider({
      provider,
      force: false,
      now: new Date("2026-10-04T12:30:00.000Z"),
    });

    expect(result.feeds[0]?.status).toBe("not_modified");
    expect(result.upserted).toBe(0);
    expect(fetchFeed).toHaveBeenCalledTimes(2);
  });
});
