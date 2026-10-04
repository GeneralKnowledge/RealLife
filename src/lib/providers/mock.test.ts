import { describe, expect, it } from "vitest";
import { MockActivityProvider } from "./mock";

describe("MockActivityProvider", () => {
  const provider = new MockActivityProvider();

  it("returns Scotland outdoor activities", async () => {
    const activities = await provider.searchActivities({});
    expect(activities.length).toBeGreaterThan(5);
    expect(activities.every((activity) => activity.region === "Scotland")).toBe(true);
  });

  it("filters by activity type and price", async () => {
    const activities = await provider.searchActivities({
      activityType: "hiking",
      maxPrice: 70,
    });

    expect(activities.length).toBeGreaterThan(0);
    expect(activities.every((activity) => activity.activityType === "hiking")).toBe(true);
    expect(activities.every((activity) => activity.priceFrom <= 70)).toBe(true);
  });

  it("returns affiliate urls", async () => {
    const [activity] = await provider.searchActivities({ limit: 1 });
    expect(activity).toBeTruthy();
    const url = await provider.getAffiliateUrl(activity!);
    expect(url).toContain("viator.com");
  });
});
