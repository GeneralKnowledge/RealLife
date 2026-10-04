import { NextResponse } from "next/server";
import { getAffiliateRedirectUrl } from "@/lib/activities";
import { trackEvent } from "@/lib/analytics";
import { appUrl } from "@/lib/creatives";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const creativeId = new URL(request.url).searchParams.get("creativeId") ?? undefined;
  const affiliateUrl = await getAffiliateRedirectUrl(id);

  if (!affiliateUrl) {
    return NextResponse.redirect(appUrl("/"));
  }

  await trackEvent({
    type: "affiliate_click",
    activityId: id,
    creativeId,
  });

  return NextResponse.redirect(affiliateUrl);
}
