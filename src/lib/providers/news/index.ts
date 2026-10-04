import { RssNewsProvider, parseRssFeedsEnv } from "./rss";
import type { NewsProvider } from "./types";

export type { NewsFeedConfig, NewsProvider, NormalizedNewsItem, FeedFetchResult } from "./types";
export {
  RssNewsProvider,
  parseRssFeedsEnv,
  parseRssXmlAsync,
  normalizeRssItem,
  stripHtml,
} from "./rss";

export function getNewsProvider(): NewsProvider {
  const name = (process.env.NEWS_PROVIDER ?? "rss").toLowerCase();
  if (name === "rss") {
    return new RssNewsProvider(parseRssFeedsEnv(process.env.NEWS_RSS_FEEDS));
  }
  throw new Error(`Unknown NEWS_PROVIDER: ${name}`);
}
