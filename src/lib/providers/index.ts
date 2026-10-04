import { MockActivityProvider } from "./mock";
import { ViatorActivityProvider } from "./viator";
import type { ActivityProvider } from "./types";

export type { Activity, ActivityProvider, ActivitySearchParams } from "./types";
export { MockActivityProvider } from "./mock";
export { ViatorActivityProvider } from "./viator";

export function getActivityProvider(): ActivityProvider {
  const providerName = (process.env.ACTIVITY_PROVIDER ?? "mock").toLowerCase();

  if (providerName === "viator") {
    const apiKey = process.env.VIATOR_API_KEY;
    if (!apiKey) {
      throw new Error("VIATOR_API_KEY is required when ACTIVITY_PROVIDER=viator");
    }

    return new ViatorActivityProvider(
      apiKey,
      process.env.VIATOR_API_BASE_URL ?? "https://api.viator.com/partner",
      process.env.VIATOR_AFFILIATE_ID ?? "",
      process.env.VIATOR_DESTINATION_ID ?? "22",
    );
  }

  return new MockActivityProvider();
}
