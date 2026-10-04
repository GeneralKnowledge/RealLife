export type NewsFeedConfig = {
  url: string;
  source: string;
};

export type NormalizedNewsItem = {
  source: string;
  externalId: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  tags: string[];
};

export type FeedFetchResult =
  | {
      kind: "items";
      items: NormalizedNewsItem[];
      etag?: string;
      lastModified?: string;
      rawHash?: string;
    }
  | {
      kind: "not_modified";
      etag?: string;
      lastModified?: string;
    }
  | {
      kind: "skipped_ttl";
    };

export type FeedFetchOptions = {
  etag?: string | null;
  lastModified?: string | null;
  maxItems?: number;
};

export interface NewsProvider {
  readonly name: string;
  listFeeds(): NewsFeedConfig[];
  fetchFeed(feed: NewsFeedConfig, options?: FeedFetchOptions): Promise<FeedFetchResult>;
}
