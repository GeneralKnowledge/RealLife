import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/urls";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const item = await prisma.newsItem.findUnique({ where: { id } });

  if (!item || item.status !== "published") {
    return NextResponse.redirect(appUrl("/news"));
  }

  const incoming = new URL(request.url);
  await trackEvent({
    type: "news_click",
    meta: {
      newsItemId: item.id,
      source: item.source,
      utm_source: incoming.searchParams.get("utm_source") ?? "site",
      utm_medium: incoming.searchParams.get("utm_medium") ?? "news",
      utm_campaign: incoming.searchParams.get("utm_campaign") ?? "outside-briefing",
      utm_content: incoming.searchParams.get("utm_content") ?? item.source,
    },
  });

  return NextResponse.redirect(item.url);
}
