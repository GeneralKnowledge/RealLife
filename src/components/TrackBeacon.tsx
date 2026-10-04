"use client";

import { useEffect } from "react";

type TrackBeaconProps = {
  type: "creative_impression" | "landing_view" | "news_impression";
  creativeId?: string;
  activityId?: string;
  meta?: Record<string, unknown>;
};

export function TrackBeacon({ type, creativeId, activityId, meta }: TrackBeaconProps) {
  const metaKey = meta ? JSON.stringify(meta) : "";

  useEffect(() => {
    const controller = new AbortController();
    const parsedMeta = metaKey ? (JSON.parse(metaKey) as Record<string, unknown>) : undefined;

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        creativeId,
        activityId,
        meta: parsedMeta,
      }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // Tracking should never break the page.
    });

    return () => controller.abort();
  }, [type, creativeId, activityId, metaKey]);

  return null;
}
