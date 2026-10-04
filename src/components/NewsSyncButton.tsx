"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SyncResponse = {
  upserted?: number;
  provider?: string;
  feeds?: Array<{
    source: string;
    status: string;
    upserted: number;
    error?: string;
  }>;
  error?: string;
};

export function NewsSyncButton() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<"sync" | "force" | null>(null);

  async function sync(force: boolean) {
    setLoading(force ? "force" : "sync");
    setMessage(null);
    const response = await fetch("/api/news/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    const data = (await response.json()) as SyncResponse;
    setLoading(null);

    if (!response.ok) {
      setMessage(data.error ?? "Sync failed");
      return;
    }

    const cacheHits = data.feeds?.filter((feed) => feed.status === "cache_hit").length ?? 0;
    const updated = data.feeds?.filter((feed) => feed.status === "updated").length ?? 0;
    const errors = data.feeds?.filter((feed) => feed.status === "error") ?? [];

    const parts = [
      `Provider ${data.provider}`,
      `${data.upserted ?? 0} items upserted`,
      `${updated} feed(s) fetched`,
      `${cacheHits} cache hit(s)`,
    ];
    if (errors.length > 0) {
      parts.push(`${errors.length} error(s): ${errors.map((e) => e.source).join(", ")}`);
    }
    setMessage(parts.join(" · "));
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void sync(false)}
        disabled={loading !== null}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading === "sync" ? "Syncing…" : "Sync feeds"}
      </button>
      <button
        type="button"
        onClick={() => void sync(true)}
        disabled={loading !== null}
        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-60"
      >
        {loading === "force" ? "Refreshing…" : "Force refresh"}
      </button>
      {message ? <p className="text-sm text-neutral-600">{message}</p> : null}
    </div>
  );
}
