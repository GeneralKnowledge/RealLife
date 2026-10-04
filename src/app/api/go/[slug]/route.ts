import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";
import { appUrl, withQuery } from "@/lib/urls";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const incoming = new URL(request.url);
  const creative = await prisma.creative.findUnique({ where: { slug } });

  if (!creative || creative.status !== "published") {
    return NextResponse.redirect(appUrl("/"));
  }

  const utm = {
    utm_source: incoming.searchParams.get("utm_source") ?? undefined,
    utm_medium: incoming.searchParams.get("utm_medium") ?? undefined,
    utm_campaign: incoming.searchParams.get("utm_campaign") ?? undefined,
    utm_content: incoming.searchParams.get("utm_content") ?? undefined,
  };

  await trackEvent({
    type: "creative_click",
    creativeId: creative.id,
    activityId: creative.activityId,
    meta: utm,
  });

  return NextResponse.redirect(
    withQuery(`/escape/${creative.slug}`, {
      ...utm,
      from: "creative",
    }),
  );
}
