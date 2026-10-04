import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/urls";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const creatives = await prisma.creative.findMany({
    where: { status: "published" },
    select: { slug: true, updatedAt: true },
  });

  return [
    {
      url: appUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...creatives.map((creative) => ({
      url: appUrl(`/escape/${creative.slug}`),
      lastModified: creative.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
