import { describe, expect, it } from "vitest";
import { buildSocialPack } from "./social";

const activity = {
  id: "act_1",
  provider: "mock",
  externalId: "x",
  title: "Loch Lomond Kayaking Adventure",
  description: "Paddle the loch",
  shortDescription: "Kayak trip",
  location: "Loch Lomond",
  region: "Scotland",
  activityType: "kayaking",
  priceFrom: 49,
  currency: "GBP",
  durationMinutes: 180,
  rating: 4.8,
  reviewCount: 10,
  imageUrl: "https://example.com/image.jpg",
  affiliateUrl: "https://example.com",
  tags: "[]",
  rawJson: null,
  syncedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const creative = {
  id: "cre_1",
  slug: "loch-lomond-escape",
  activityId: "act_1",
  headline: "YOUR BED HAS SEEN ENOUGH OF YOU.",
  subheadline: "Get out of the routine. Loch Lomond is waiting.",
  ctaLabel: "PLAN THE ESCAPE",
  locationLine: "LOCH LOMOND",
  priceLine: "kayaking · From £49 · 3 hours",
  imageUrl: "https://example.com/image.jpg",
  status: "published",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("buildSocialPack", () => {
  it("generates posts for major platforms", () => {
    const pack = buildSocialPack(creative, activity);
    const platforms = pack.map((post) => post.platform);

    expect(platforms).toEqual([
      "instagram",
      "instagram_story",
      "x",
      "facebook",
      "tiktok",
    ]);
    expect(pack.every((post) => post.caption.includes("YOUR BED"))).toBe(true);
    expect(pack.every((post) => post.ctaUrl.includes("/api/go/loch-lomond-escape"))).toBe(true);
    expect(pack.find((post) => post.platform === "x")?.caption.length).toBeLessThanOrEqual(260);
    expect(pack.find((post) => post.platform === "instagram")?.hashtags).toContain("#GetOutside");
  });
});
