import type { Metadata } from "next";
import Link from "next/link";
import { NewsBriefing } from "@/components/NewsBriefing";
import { listPublishedNewsWithRelated } from "@/lib/news";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Outside briefing",
  description:
    "Scotland outdoors news and trail signals — then soft links into bookable Get Outside escapes.",
};

export default async function NewsPage() {
  const items = await listPublishedNewsWithRelated(30);

  return (
    <main className="min-h-[100svh]">
      <div className="mx-auto w-full max-w-6xl px-6 pt-8">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="display text-2xl tracking-[0.08em] text-[var(--accent-strong)] md:text-3xl"
          >
            GET OUTSIDE
          </Link>
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] transition hover:text-white"
          >
            Escapes
          </Link>
        </header>
      </div>

      {items.length > 0 ? (
        <NewsBriefing
          items={items}
          heading="Outside briefing"
          showViewAll={false}
          impressionSurface="news"
        />
      ) : (
        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <h1 className="display text-4xl uppercase md:text-5xl">Outside briefing</h1>
          <p className="mt-3 max-w-xl text-[var(--muted)]">
            No published stories yet. Sync RSS feeds from admin when you are ready to test the
            experiment.
          </p>
        </section>
      )}
    </main>
  );
}
