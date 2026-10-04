import { customAlphabet } from "nanoid";
import type { Activity as DbActivity } from "@prisma/client";
import { prisma } from "./db";
import { generateSocialPostsForCreative } from "./social";

const slugId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

const HEADLINES = [
  "THE INTERNET IS NOT REAL LIFE.",
  "YOUR BED HAS SEEN ENOUGH OF YOU.",
  "CLOSE THE TABS. OPEN THE MAP.",
  "THE OUTDOORS DOESN'T NEED A PASSWORD.",
  "SCROLL LESS. STRIDE MORE.",
  "YOUR CALENDAR CAN WAIT.",
  "LEAVE THE GROUP CHAT BEHIND.",
  "THE MOUNTAINS DON'T CARE ABOUT YOUR INBOX.",
];

function pickHeadline(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % HEADLINES.length;
  }
  return HEADLINES[hash] ?? HEADLINES[0]!;
}

function formatPrice(priceFrom: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(priceFrom);
  } catch {
    return `${currency} ${Math.round(priceFrom)}`;
  }
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export function buildCreativeDraft(activity: DbActivity) {
  const headline = pickHeadline(activity.id + activity.title);
  const price = formatPrice(activity.priceFrom, activity.currency);
  const duration = formatDuration(activity.durationMinutes);
  const typeLabel = activity.activityType.replace("-", " ");

  return {
    headline,
    subheadline: `Get out of the routine. ${activity.location} is waiting.`,
    ctaLabel: "PLAN THE ESCAPE",
    locationLine: activity.location.toUpperCase(),
    priceLine: duration
      ? `${typeLabel} · From ${price} · ${duration}`
      : `${typeLabel} · From ${price}`,
    imageUrl: activity.imageUrl,
  };
}

export async function createCreativeFromActivity(activityId: string) {
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) {
    throw new Error("Activity not found");
  }

  const draft = buildCreativeDraft(activity);
  const base = activity.location
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const creative = await prisma.creative.create({
    data: {
      slug: `${base || "escape"}-${slugId()}`,
      activityId: activity.id,
      ...draft,
      status: "published",
    },
    include: { activity: true },
  });

  await generateSocialPostsForCreative(creative.id);

  return prisma.creative.findUniqueOrThrow({
    where: { id: creative.id },
    include: { activity: true, socialPosts: true },
  });
}

export function appUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
