import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject } from "ai";
import { z } from "zod";
import type { Activity as DbActivity, Creative } from "@prisma/client";

export type ContentAiMode = "ai" | "template";

export type ContentAiConfig = {
  enabled: boolean;
  baseURL: string;
  apiKey: string | undefined;
  model: string;
  supportsStructuredOutputs: boolean;
};

export type AiSocialPostDraft = {
  platform: "instagram" | "instagram_story" | "x" | "facebook" | "tiktok";
  caption: string;
  hashtags: string;
  ctaLabel: string;
};

function envFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

/** Read OpenAI-compatible content AI settings from env. */
export function getContentAiConfig(): ContentAiConfig {
  const baseURL = (process.env.CONTENT_AI_BASE_URL ?? "").trim().replace(/\/+$/, "");
  const apiKey = (process.env.CONTENT_AI_API_KEY ?? "").trim() || undefined;
  const model = (process.env.CONTENT_AI_MODEL ?? "gpt-4o-mini").trim() || "gpt-4o-mini";
  const explicitlyEnabled = envFlag("CONTENT_AI_ENABLED", false);
  // Auto-enable when a base URL is set (key optional for local proxies like Ollama).
  const enabled = explicitlyEnabled || Boolean(baseURL);
  const supportsStructuredOutputs = envFlag("CONTENT_AI_STRUCTURED_OUTPUTS", true);

  return {
    enabled: enabled && Boolean(baseURL),
    baseURL: baseURL || "https://api.openai.com/v1",
    apiKey,
    model,
    supportsStructuredOutputs,
  };
}

export function isContentAiEnabled(): boolean {
  return getContentAiConfig().enabled;
}

function getLanguageModel(config: ContentAiConfig = getContentAiConfig()) {
  const provider = createOpenAICompatible({
    name: "content-ai",
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    supportsStructuredOutputs: config.supportsStructuredOutputs,
  });
  return provider.chatModel(config.model);
}

const creativeCopySchema = z.object({
  headline: z
    .string()
    .describe(
      "Punchy uppercase outdoor ad headline, max ~12 words. Get Outside voice: anti-scroll, pro-real-life.",
    ),
  subheadline: z
    .string()
    .describe("One short supporting sentence naming the place/activity without sounding like a brochure."),
  ctaLabel: z
    .string()
    .describe("Short CTA button label in title case or uppercase, 2–4 words."),
});

const socialPackSchema = z.object({
  posts: z.array(
    z.object({
      platform: z.enum(["instagram", "instagram_story", "x", "facebook", "tiktok"]),
      caption: z.string().describe("Platform-ready caption body. Include line breaks where natural."),
      hashtags: z.string().describe("Space-separated hashtags including #GetOutside and place tags."),
      ctaLabel: z.string(),
    }),
  ),
});

export type AiCreativeCopy = z.infer<typeof creativeCopySchema>;

function activityBrief(activity: DbActivity): string {
  const duration =
    activity.durationMinutes == null
      ? "unknown"
      : activity.durationMinutes < 60
        ? `${activity.durationMinutes} minutes`
        : `${Math.round(activity.durationMinutes / 60)} hours`;

  return [
    `Title: ${activity.title}`,
    `Location: ${activity.location}, ${activity.region}`,
    `Type: ${activity.activityType}`,
    `From: ${activity.currency} ${activity.priceFrom}`,
    `Duration: ${duration}`,
    `Rating: ${activity.rating ?? "n/a"} (${activity.reviewCount} reviews)`,
    `Short description: ${activity.shortDescription ?? activity.description.slice(0, 280)}`,
  ].join("\n");
}

export async function generateCreativeCopyWithAi(
  activity: DbActivity,
): Promise<AiCreativeCopy> {
  const config = getContentAiConfig();
  if (!config.enabled) {
    throw new Error("Content AI is not enabled");
  }

  const { object } = await generateObject({
    model: getLanguageModel(config),
    schema: creativeCopySchema,
    schemaName: "CreativeCopy",
    schemaDescription: "Ad creative copy for Get Outside Scotland outdoor escapes",
    system: [
      "You write paid social / Meta ad copy for Get Outside, a Scotland outdoor-trip brand.",
      "Voice: blunt, cinematic, anti-doomscroll. Not corporate tourism.",
      "Never invent prices or claim things not in the brief.",
      "Headlines should feel like a shove outdoors, not a hotel slogan.",
    ].join(" "),
    prompt: `Write creative copy for this bookable Scotland outdoor activity:\n\n${activityBrief(activity)}`,
  });

  return object;
}

export async function generateSocialPackWithAi(
  creative: Creative,
  activity: DbActivity,
): Promise<AiSocialPostDraft[]> {
  const config = getContentAiConfig();
  if (!config.enabled) {
    throw new Error("Content AI is not enabled");
  }

  const priceBit = creative.priceLine ?? `From ${activity.currency} ${activity.priceFrom}`;

  const { object } = await generateObject({
    model: getLanguageModel(config),
    schema: socialPackSchema,
    schemaName: "SocialPack",
    schemaDescription: "Multi-platform social captions for one creative",
    system: [
      "You write platform-native social captions for Get Outside (Scotland outdoor escapes).",
      "Keep the brand voice: direct, outdoor, anti-scroll.",
      "Return exactly one post per platform: instagram, instagram_story, x, facebook, tiktok.",
      "X captions must be under 240 characters including hashtags.",
      "Instagram can be longer with a clear CTA.",
      "Do not invent URLs — CTAs are labels only; links are added by the app.",
      "Include #GetOutside and relevant Scotland/place hashtags.",
    ].join(" "),
    prompt: [
      "Creative:",
      `Headline: ${creative.headline}`,
      `Subheadline: ${creative.subheadline ?? ""}`,
      `CTA label: ${creative.ctaLabel}`,
      `Location line: ${creative.locationLine ?? activity.location}`,
      `Price line: ${priceBit}`,
      "",
      "Activity brief:",
      activityBrief(activity),
    ].join("\n"),
  });

  const byPlatform = new Map(object.posts.map((post) => [post.platform, post]));
  const platforms: AiSocialPostDraft["platform"][] = [
    "instagram",
    "instagram_story",
    "x",
    "facebook",
    "tiktok",
  ];

  return platforms.map((platform) => {
    const draft = byPlatform.get(platform);
    let caption = draft?.caption?.trim() || creative.headline;
    if (platform === "x" && caption.length > 260) {
      caption = `${caption.slice(0, 259).trimEnd()}…`;
    }

    return {
      platform,
      caption,
      hashtags: draft?.hashtags?.trim() || "#GetOutside #Scotland",
      ctaLabel: draft?.ctaLabel?.trim() || creative.ctaLabel,
    };
  });
}
