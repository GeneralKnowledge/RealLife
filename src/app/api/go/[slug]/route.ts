import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";
import { appUrl } from "@/lib/creatives";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const creative = await prisma.creative.findUnique({ where: { slug } });

  if (!creative || creative.status !== "published") {
    return NextResponse.redirect(appUrl("/"));
  }

  await trackEvent({
    type: "creative_click",
    creativeId: creative.id,
    activityId: creative.activityId,
  });

  return NextResponse.redirect(appUrl(`/escape/${creative.slug}`));
}
