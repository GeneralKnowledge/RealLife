"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sync() {
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/sync", { method: "POST" });
    const data = (await response.json()) as {
      upserted?: number;
      provider?: string;
      error?: string;
    };
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Sync failed");
      return;
    }

    setMessage(`Synced ${data.upserted ?? 0} activities from ${data.provider}.`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={sync}
        disabled={loading}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Syncing…" : "Sync from provider"}
      </button>
      {message ? <p className="text-sm text-neutral-600">{message}</p> : null}
    </div>
  );
}
