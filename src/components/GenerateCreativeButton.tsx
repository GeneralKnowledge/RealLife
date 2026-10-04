"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateCreativeButton({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/creatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId }),
    });
    const data = (await response.json()) as {
      creative?: { slug: string };
      error?: string;
    };
    setLoading(false);

    if (!response.ok || !data.creative) {
      setError(data.error ?? "Failed to generate creative");
      return;
    }

    router.push(`/admin/creatives/${data.creative.slug}`);
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 disabled:opacity-60"
      >
        {loading ? "Generating…" : "Generate creative"}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
