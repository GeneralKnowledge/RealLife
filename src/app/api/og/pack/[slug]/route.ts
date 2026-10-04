import JSZip from "jszip";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { appUrl, trackedGoUrl, platformUtm } from "@/lib/urls";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const FORMATS = ["square", "story", "og"] as const;

export async function GET(request: Request, context: RouteContext) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const creative = await prisma.creative.findUnique({
    where: { slug },
    include: { socialPosts: true, activity: true },
  });

  if (!creative) {
    return NextResponse.json({ error: "Creative not found" }, { status: 404 });
  }

  const zip = new JSZip();
  const base = appUrl();

  for (const format of FORMATS) {
    const imageUrl = `${base}/api/og/creative/${slug}?format=${format}`;
    const response = await fetch(imageUrl);
    if (!response.ok) {
      continue;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    zip.file(`${slug}-${format}.png`, bytes);
  }

  const csvRows = [
    ["platform", "format", "cta_url", "caption", "hashtags"].join(","),
    ...creative.socialPosts.map((post) => {
      const cells = [
        post.platform,
        post.format,
        post.ctaUrl,
        `"${post.caption.replace(/"/g, '""')}"`,
        `"${post.hashtags.replace(/"/g, '""')}"`,
      ];
      return cells.join(",");
    }),
  ];

  if (creative.socialPosts.length === 0) {
    csvRows.push(
      [
        "meta_paid",
        "square",
        trackedGoUrl(slug, {
          utm_source: "meta",
          utm_medium: "paid",
          utm_campaign: slug,
        }),
        `"${creative.headline}"`,
        '"#GetOutside #Scotland"',
      ].join(","),
    );
  }

  zip.file(`${slug}-captions.csv`, csvRows.join("\n"));
  zip.file(
    `${slug}-links.txt`,
    [
      `Landing: ${appUrl(`/escape/${slug}`)}`,
      `Ad preview: ${appUrl(`/c/${slug}`)}`,
      `Tracked click (meta): ${trackedGoUrl(slug, { utm_source: "meta", utm_medium: "paid", utm_campaign: slug })}`,
      `Tracked click (organic ig): ${trackedGoUrl(slug, platformUtm("instagram"))}`,
      `Square creative: ${appUrl(`/api/og/creative/${slug}?format=square`)}`,
      `Story creative: ${appUrl(`/api/og/creative/${slug}?format=story`)}`,
      `OG image: ${appUrl(`/api/og/creative/${slug}?format=og`)}`,
    ].join("\n"),
  );

  const archive = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(archive), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}-ad-pack.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
