import { NextResponse } from "next/server";
import { getAffiliateRedirectUrl } from "@/lib/activities";
import { trackEvent } from "@/lib/analytics";
import { appUrl } from "@/lib/urls";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const creativeId = url.searchParams.get("creativeId") ?? undefined;
  const affiliateUrl = await getAffiliateRedirectUrl(id);

  if (!affiliateUrl) {
    return NextResponse.redirect(appUrl("/"));
  }

  await trackEvent({
    type: "affiliate_click",
    activityId: id,
    creativeId,
    meta: {
      utm_source: url.searchParams.get("utm_source"),
      utm_medium: url.searchParams.get("utm_medium"),
      utm_campaign: url.searchParams.get("utm_campaign"),
      utm_content: url.searchParams.get("utm_content"),
    },
  });

  return NextResponse.redirect(affiliateUrl);
}
