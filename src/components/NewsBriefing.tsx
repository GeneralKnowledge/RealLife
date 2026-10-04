import Link from "next/link";
import { TrackBeacon } from "@/components/TrackBeacon";
import type { RelatedEscape } from "@/lib/news";

export type NewsBriefingItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: Date | string;
  relatedEscape: RelatedEscape | null;
};

type NewsBriefingProps = {
  items: NewsBriefingItem[];
  heading?: string;
  showViewAll?: boolean;
  impressionSurface?: string;
};

function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function NewsBriefing({
  items,
  heading = "Outside briefing",
  showViewAll = true,
  impressionSurface = "home",
}: NewsBriefingProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <TrackBeacon
        type="news_impression"
        meta={{
          surface: impressionSurface,
          count: items.length,
          newsItemIds: items.map((item) => item.id),
        }}
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="display text-4xl uppercase md:text-5xl">{heading}</h2>
          <p className="mt-3 text-[var(--muted)]">
            Scotland outdoors signals from the wider world — then a soft nudge toward a real escape.
          </p>
        </div>
        {showViewAll ? (
          <Link
            href="/news"
            className="text-xs uppercase tracking-[0.18em] text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
          >
            More briefing
          </Link>
        ) : null}
      </div>

      <ul className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {items.map((item) => (
          <li key={item.id} className="grid gap-3 py-6 md:grid-cols-[1fr_auto] md:items-start md:gap-8">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                {item.source.replaceAll("-", " ")}
                {formatDate(item.publishedAt) ? ` · ${formatDate(item.publishedAt)}` : ""}
              </p>
              <a
                href={`/api/news/go/${item.id}`}
                className="display block text-2xl uppercase transition hover:text-[var(--accent-strong)] md:text-3xl"
              >
                {item.title}
              </a>
              {item.summary ? (
                <p className="max-w-3xl text-sm text-[var(--muted)] md:text-base">{item.summary}</p>
              ) : null}
            </div>
            {item.relatedEscape ? (
              <Link
                href={`/api/go/${item.relatedEscape.slug}?utm_source=site&utm_medium=news&utm_campaign=outside-briefing&utm_content=related-escape`}
                className="text-left text-xs uppercase tracking-[0.16em] text-white/80 transition hover:text-[var(--accent-strong)] md:max-w-[14rem] md:text-right"
              >
                Nearby escape
                <span className="mt-1 block normal-case tracking-normal text-[var(--muted)]">
                  {item.relatedEscape.locationLine ?? item.relatedEscape.headline}
                </span>
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
