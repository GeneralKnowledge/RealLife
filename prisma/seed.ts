import { PrismaClient } from "@prisma/client";
import { mockActivities } from "../src/lib/providers/mock";
import { buildCreativeDraft } from "../src/lib/creatives";
import { generateSocialPostsForCreative } from "../src/lib/social";

const prisma = new PrismaClient();

const sampleNews = [
  {
    source: "seed",
    externalId: "glencoe-trail-conditions",
    title: "Glencoe trail conditions improve ahead of a clear weekend",
    summary:
      "Paths around Glencoe are drying after wet weather — a reminder Scotland's hills are waiting when the inbox isn't.",
    url: "https://example.com/news/glencoe-trail-conditions",
    publishedAt: new Date("2026-10-01T09:00:00.000Z"),
    tags: ["glencoe", "trail", "scotland", "hiking"],
    status: "published",
  },
  {
    source: "seed",
    externalId: "loch-lomond-wildlife",
    title: "Wildlife watching picks up around Loch Lomond",
    summary:
      "Seasonal wildlife sightings are drawing walkers and paddlers back to the loch for slow outdoor days.",
    url: "https://example.com/news/loch-lomond-wildlife",
    publishedAt: new Date("2026-10-02T11:30:00.000Z"),
    tags: ["lomond", "wildlife", "scotland", "outdoor"],
    status: "published",
  },
  {
    source: "seed",
    externalId: "politics-noise",
    title: "Holyrood schedules another late sitting",
    summary: "Parliamentary procedure story with no outdoor angle — stays draft for filter demos.",
    url: "https://example.com/news/holyrood-sitting",
    publishedAt: new Date("2026-10-03T08:00:00.000Z"),
    tags: [],
    status: "draft",
  },
] as const;

async function main() {
  for (const activity of mockActivities) {
    await prisma.activity.upsert({
      where: {
        provider_externalId: {
          provider: activity.provider,
          externalId: activity.externalId,
        },
      },
      create: {
        provider: activity.provider,
        externalId: activity.externalId,
        title: activity.title,
        description: activity.description,
        shortDescription: activity.shortDescription,
        location: activity.location,
        region: activity.region,
        activityType: activity.activityType,
        priceFrom: activity.priceFrom,
        currency: activity.currency,
        durationMinutes: activity.durationMinutes,
        rating: activity.rating,
        reviewCount: activity.reviewCount ?? 0,
        imageUrl: activity.imageUrl,
        affiliateUrl: activity.affiliateUrl,
        tags: JSON.stringify(activity.tags),
      },
      update: {
        title: activity.title,
        description: activity.description,
        shortDescription: activity.shortDescription,
        location: activity.location,
        region: activity.region,
        activityType: activity.activityType,
        priceFrom: activity.priceFrom,
        currency: activity.currency,
        durationMinutes: activity.durationMinutes,
        rating: activity.rating,
        reviewCount: activity.reviewCount ?? 0,
        imageUrl: activity.imageUrl,
        affiliateUrl: activity.affiliateUrl,
        tags: JSON.stringify(activity.tags),
      },
    });
  }

  const featured = await prisma.activity.findMany({
    where: {
      externalId: {
        in: ["cairngorms-guided-hike", "loch-lomond-kayak", "glencoe-adventure"],
      },
    },
  });

  for (const activity of featured) {
    let creative = await prisma.creative.findFirst({
      where: { activityId: activity.id },
    });

    if (!creative) {
      const draft = buildCreativeDraft(activity);
      const slugBase = activity.location.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      creative = await prisma.creative.create({
        data: {
          slug: `${slugBase}-escape`,
          activityId: activity.id,
          ...draft,
          status: "published",
        },
      });
    }

    await generateSocialPostsForCreative(creative.id);
  }

  for (const item of sampleNews) {
    await prisma.newsItem.upsert({
      where: {
        source_externalId: {
          source: item.source,
          externalId: item.externalId,
        },
      },
      create: {
        source: item.source,
        externalId: item.externalId,
        title: item.title,
        summary: item.summary,
        url: item.url,
        publishedAt: item.publishedAt,
        tags: JSON.stringify(item.tags),
        region: "Scotland",
        status: item.status,
      },
      update: {
        title: item.title,
        summary: item.summary,
        url: item.url,
        publishedAt: item.publishedAt,
        tags: JSON.stringify(item.tags),
        status: item.status,
      },
    });
  }

  console.log(
    `Seeded ${mockActivities.length} Scotland activities, sample creatives, social packs, and ${sampleNews.length} news items.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
