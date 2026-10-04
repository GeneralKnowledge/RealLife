"use client";

import { useEffect } from "react";

type TrackBeaconProps = {
  type: "creative_impression" | "landing_view";
  creativeId?: string;
  activityId?: string;
};

export function TrackBeacon({ type, creativeId, activityId }: TrackBeaconProps) {
  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, creativeId, activityId }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // Tracking should never break the page.
    });

    return () => controller.abort();
  }, [type, creativeId, activityId]);

  return null;
}
