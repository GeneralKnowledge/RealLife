import { describe, expect, it } from "vitest";
import { buildCreativeDraft } from "./creatives";

describe("buildCreativeDraft", () => {
  it("builds a cinematic creative from an activity", () => {
    const draft = buildCreativeDraft({
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
    });

    expect(draft.headline.length).toBeGreaterThan(5);
    expect(draft.locationLine).toBe("LOCH LOMOND");
    expect(draft.priceLine.toLowerCase()).toContain("kayaking");
    expect(draft.priceLine).toContain("£");
    expect(draft.ctaLabel).toBeTruthy();
  });
});
