import { PrismaClient } from "@prisma/client";
import { mockActivities } from "../src/lib/providers/mock";
import { buildCreativeDraft } from "../src/lib/creatives";
import { generateSocialPostsForCreative } from "../src/lib/social";

const prisma = new PrismaClient();

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

  console.log(
    `Seeded ${mockActivities.length} Scotland activities, sample creatives, and social packs.`,
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
