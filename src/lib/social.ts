import type { Activity as DbActivity, Creative } from "@prisma/client";
import { prisma } from "./db";
import { platformUtm, trackedGoUrl } from "./urls";

export const SOCIAL_PLATFORMS = [
  "instagram",
  "instagram_story",
  "x",
  "facebook",
  "tiktok",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type SocialPostDraft = {
  platform: SocialPlatform;
  format: "feed" | "story" | "square";
  caption: string;
  hashtags: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
};

const PLATFORM_META: Record<
  SocialPlatform,
  { label: string; format: SocialPostDraft["format"]; maxCaption?: number }
> = {
  instagram: { label: "Instagram Feed", format: "square" },
  instagram_story: { label: "Instagram Story", format: "story" },
  x: { label: "X / Twitter", format: "feed", maxCaption: 260 },
  facebook: { label: "Facebook", format: "feed" },
  tiktok: { label: "TikTok", format: "story" },
};

function locationHashtag(location: string): string {
  return `#${location.replace(/[^a-zA-Z0-9]+/g, "")}`;
}

function activityHashtags(activity: DbActivity): string[] {
  const typeTag = `#${activity.activityType.replace(/[^a-zA-Z0-9]+/g, "")}`;
  const base = [
    "#GetOutside",
    "#Scotland",
    locationHashtag(activity.location),
    typeTag,
    "#WeekendEscape",
    "#OutdoorAdventure",
  ];
  return [...new Set(base.filter((tag) => tag.length > 2))];
}

function trimToLimit(text: string, limit?: number): string {
  if (!limit || text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function buildSocialPack(
  creative: Creative,
  activity: DbActivity,
): SocialPostDraft[] {
  const hashtags = activityHashtags(activity);
  const hashtagBlock = hashtags.join(" ");
  const priceBit = creative.priceLine ?? `From ${activity.currency} ${activity.priceFrom}`;
  const place = activity.location;

  function linkFor(platform: SocialPlatform) {
    return trackedGoUrl(creative.slug, platformUtm(platform));
  }

  const longBody = [
    creative.headline,
    "",
    creative.subheadline ?? `${place} is calling.`,
    "",
    `${priceBit}.`,
    "",
    "Link in bio — or tap through and book it.",
  ].join("\n");

  const storyBody = [
    creative.headline,
    "",
    place.toUpperCase(),
    priceBit,
    "",
    "Swipe up / tap link",
  ].join("\n");

  const tiktokBody = [
    `${creative.headline}`,
    `${place} · ${priceBit}`,
    "Who's coming?",
    "",
    hashtagBlock,
  ].join("\n");

  const xLink = linkFor("x");
  const shortBody = [
    `${creative.headline} ${place}. ${priceBit}.`,
    `Get outside → ${xLink}`,
  ].join("\n");

  const fbLink = linkFor("facebook");

  const drafts: SocialPostDraft[] = [
    {
      platform: "instagram",
      format: "square",
      caption: `${longBody}\n\n${hashtagBlock}`,
      hashtags: hashtagBlock,
      ctaLabel: creative.ctaLabel,
      ctaUrl: linkFor("instagram"),
      imageUrl: creative.imageUrl,
    },
    {
      platform: "instagram_story",
      format: "story",
      caption: storyBody,
      hashtags: hashtagBlock,
      ctaLabel: "Book this escape",
      ctaUrl: linkFor("instagram_story"),
      imageUrl: creative.imageUrl,
    },
    {
      platform: "x",
      format: "feed",
      caption: trimToLimit(`${shortBody}\n${hashtags.slice(0, 3).join(" ")}`, 260),
      hashtags: hashtags.slice(0, 3).join(" "),
      ctaLabel: creative.ctaLabel,
      ctaUrl: xLink,
      imageUrl: creative.imageUrl,
    },
    {
      platform: "facebook",
      format: "feed",
      caption: [
        creative.headline,
        "",
        `${creative.subheadline ?? ""}`.trim(),
        "",
        `📍 ${place}`,
        `💸 ${priceBit}`,
        "",
        `Book here: ${fbLink}`,
        "",
        hashtagBlock,
      ].join("\n"),
      hashtags: hashtagBlock,
      ctaLabel: creative.ctaLabel,
      ctaUrl: fbLink,
      imageUrl: creative.imageUrl,
    },
    {
      platform: "tiktok",
      format: "story",
      caption: tiktokBody,
      hashtags: hashtagBlock,
      ctaLabel: "Link in bio",
      ctaUrl: linkFor("tiktok"),
      imageUrl: creative.imageUrl,
    },
  ];

  return drafts.map((draft) => ({
    ...draft,
    caption: trimToLimit(draft.caption, PLATFORM_META[draft.platform].maxCaption),
  }));
}

export function platformLabel(platform: string): string {
  if (platform in PLATFORM_META) {
    return PLATFORM_META[platform as SocialPlatform].label;
  }
  return platform;
}

export async function generateSocialPostsForCreative(creativeId: string) {
  const creative = await prisma.creative.findUnique({
    where: { id: creativeId },
    include: { activity: true },
  });

  if (!creative) {
    throw new Error("Creative not found");
  }

  const drafts = buildSocialPack(creative, creative.activity);
  const posts = [];

  for (const draft of drafts) {
    const post = await prisma.socialPost.upsert({
      where: {
        creativeId_platform_format: {
          creativeId: creative.id,
          platform: draft.platform,
          format: draft.format,
        },
      },
      create: {
        creativeId: creative.id,
        platform: draft.platform,
        format: draft.format,
        caption: draft.caption,
        hashtags: draft.hashtags,
        ctaLabel: draft.ctaLabel,
        ctaUrl: draft.ctaUrl,
        imageUrl: draft.imageUrl,
        status: "ready",
      },
      update: {
        caption: draft.caption,
        hashtags: draft.hashtags,
        ctaLabel: draft.ctaLabel,
        ctaUrl: draft.ctaUrl,
        imageUrl: draft.imageUrl,
        status: "ready",
      },
    });
    posts.push(post);
  }

  return posts;
}
