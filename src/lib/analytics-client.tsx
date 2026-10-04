"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

let posthogReady = false;

function ensurePostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || posthogReady || typeof window === "undefined") return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: false,
    persistence: "localStorage+cookie",
  });
  posthogReady = true;
}

function ensureMetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pixelId || typeof window === "undefined" || window.fbq) return;

  const stub = function (...args: unknown[]) {
    (stub as unknown as { queue: unknown[] }).queue.push(args);
  } as ((...args: unknown[]) => void) & { queue: unknown[]; loaded?: boolean; version?: string };
  stub.queue = [];
  stub.loaded = true;
  stub.version = "2.0";
  window.fbq = stub;
  window._fbq = stub;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.onload = () => {
    window.fbq?.("init", pixelId);
    window.fbq?.("track", "PageView");
  };
  document.head.appendChild(script);
}

function AnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    ensurePostHog();
    ensureMetaPixel();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const props = {
      path: pathname,
      utm_source: searchParams.get("utm_source") ?? undefined,
      utm_medium: searchParams.get("utm_medium") ?? undefined,
      utm_campaign: searchParams.get("utm_campaign") ?? undefined,
      utm_content: searchParams.get("utm_content") ?? undefined,
    };
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY && posthogReady) {
      posthog.capture("$pageview", props);
    }
    if (process.env.NEXT_PUBLIC_META_PIXEL_ID) {
      window.fbq?.("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsBeacon() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY && !process.env.NEXT_PUBLIC_META_PIXEL_ID) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AnalyticsInner />
    </Suspense>
  );
}
