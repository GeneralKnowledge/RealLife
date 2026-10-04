import { describe, expect, it } from "vitest";
import { platformUtm, trackedGoUrl } from "./urls";

describe("trackedGoUrl", () => {
  it("adds UTM params for ad click tracking", () => {
    const url = trackedGoUrl("glencoe-escape", {
      utm_source: "meta",
      utm_medium: "paid",
      utm_campaign: "scotland-weekends",
    });

    expect(url).toContain("/api/go/glencoe-escape");
    expect(url).toContain("utm_source=meta");
    expect(url).toContain("utm_medium=paid");
    expect(url).toContain("utm_campaign=scotland-weekends");
  });

  it("maps platforms to UTM sources", () => {
    const utm = platformUtm("instagram");
    expect(utm.utm_source).toBe("instagram");
    expect(trackedGoUrl("x", utm)).toContain("utm_source=instagram");
  });
});
