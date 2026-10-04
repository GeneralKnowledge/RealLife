"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateSocialButton({
  adminToken,
  creativeId,
  activityId,
  label = "Generate social pack",
}: {
  adminToken: string;
  creativeId?: string;
  activityId?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/social/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
      },
      body: JSON.stringify({ creativeId, activityId }),
    });

    const data = (await response.json()) as {
      creative?: { slug: string };
      error?: string;
    };
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Failed to generate social posts");
      return;
    }

    if (data.creative?.slug) {
      router.push(`/admin/creatives/${data.creative.slug}`);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {loading ? "Generating…" : label}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
