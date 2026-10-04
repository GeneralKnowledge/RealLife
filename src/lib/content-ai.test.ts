import { afterEach, describe, expect, it } from "vitest";
import { getContentAiConfig, isContentAiEnabled } from "./content-ai";

const KEYS = [
  "CONTENT_AI_ENABLED",
  "CONTENT_AI_BASE_URL",
  "CONTENT_AI_API_KEY",
  "CONTENT_AI_MODEL",
  "CONTENT_AI_STRUCTURED_OUTPUTS",
] as const;

const original = Object.fromEntries(KEYS.map((key) => [key, process.env[key]])) as Record<
  (typeof KEYS)[number],
  string | undefined
>;

afterEach(() => {
  for (const key of KEYS) {
    if (original[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original[key];
    }
  }
});

describe("getContentAiConfig", () => {
  it("is disabled by default", () => {
    for (const key of KEYS) delete process.env[key];
    expect(isContentAiEnabled()).toBe(false);
    expect(getContentAiConfig().enabled).toBe(false);
  });

  it("auto-enables when CONTENT_AI_BASE_URL is set (custom API)", () => {
    for (const key of KEYS) delete process.env[key];
    process.env.CONTENT_AI_BASE_URL = "https://llm.example.com/v1/";
    process.env.CONTENT_AI_MODEL = "my-model";

    const config = getContentAiConfig();
    expect(config.enabled).toBe(true);
    expect(config.baseURL).toBe("https://llm.example.com/v1");
    expect(config.model).toBe("my-model");
    expect(config.apiKey).toBeUndefined();
  });

  it("keeps api key when provided", () => {
    for (const key of KEYS) delete process.env[key];
    process.env.CONTENT_AI_BASE_URL = "https://openrouter.ai/api/v1";
    process.env.CONTENT_AI_API_KEY = "sk-test";

    expect(getContentAiConfig().apiKey).toBe("sk-test");
  });

  it("does not enable when only CONTENT_AI_ENABLED=true without base URL", () => {
    for (const key of KEYS) delete process.env[key];
    process.env.CONTENT_AI_ENABLED = "true";
    expect(isContentAiEnabled()).toBe(false);
  });
});
