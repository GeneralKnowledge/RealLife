export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
};

export function appUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

export function withQuery(path: string, params: Record<string, string | undefined>): string {
  const url = new URL(path.startsWith("http") ? path : appUrl(path));
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Tracked creative click URL with UTM defaults for social/ads packs. */
export function trackedGoUrl(
  slug: string,
  utm: UtmParams & { platform?: string } = {},
): string {
  return withQuery(`/api/go/${slug}`, {
    utm_source: utm.utm_source ?? utm.platform ?? "getoutside",
    utm_medium: utm.utm_medium ?? "social",
    utm_campaign: utm.utm_campaign ?? slug,
    utm_content: utm.utm_content,
  });
}

export function platformUtm(platform: string): UtmParams & { platform: string } {
  const medium =
    platform === "x" || platform === "facebook" || platform.startsWith("instagram")
      ? "social"
      : "social";
  return {
    platform,
    utm_source: platform,
    utm_medium: medium,
    utm_campaign: "scotland-escapes",
    utm_content: platform,
  };
}
