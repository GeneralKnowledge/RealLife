import { NewsStatusButtons } from "@/components/NewsStatusButtons";
import { NewsSyncButton } from "@/components/NewsSyncButton";
import { listAdminNews, listFeedCaches } from "@/lib/news";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminNewsPage() {
  const [items, caches] = await Promise.all([listAdminNews(100), listFeedCaches()]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">News</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Editorial Outside briefing from cached RSS feeds. Public pages never hit the feeds
            directly.
          </p>
        </div>
        <NewsSyncButton />
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Feed cache
        </h3>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-[0.12em] text-neutral-500">
              <tr>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Last status</th>
                <th className="px-4 py-3">Fetched</th>
                <th className="px-4 py-3">Next refresh after</th>
              </tr>
            </thead>
            <tbody>
              {caches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-neutral-500">
                    No feeds cached yet. Sync feeds to pull RSS (respects TTL).
                  </td>
                </tr>
              ) : (
                caches.map((cache) => (
                  <tr key={cache.id} className="border-t border-neutral-100 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">{cache.source}</p>
                      <p className="mt-1 max-w-md break-all text-xs text-neutral-500">
                        {cache.feedUrl}
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize">{cache.lastStatus.replaceAll("_", " ")}</td>
                    <td className="px-4 py-3">{formatDate(cache.fetchedAt)}</td>
                    <td className="px-4 py-3">{formatDate(cache.expiresAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Items
        </h3>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-[0.12em] text-neutral-500">
              <tr>
                <th className="px-4 py-3">Story</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-neutral-500">
                    No news items yet. Sync feeds or seed the database.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-neutral-100 align-top">
                    <td className="px-4 py-3">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {item.title}
                      </a>
                      {item.summary ? (
                        <p className="mt-1 max-w-xl text-xs text-neutral-500 line-clamp-2">
                          {item.summary}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{item.source}</td>
                    <td className="px-4 py-3">{formatDate(item.publishedAt)}</td>
                    <td className="px-4 py-3">
                      <NewsStatusButtons id={item.id} status={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
