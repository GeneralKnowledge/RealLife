import { NextResponse } from "next/server";
import { z } from "zod";
import { trackEvent, type EventType } from "@/lib/analytics";

const bodySchema = z.object({
  type: z.enum([
    "creative_impression",
    "creative_click",
    "landing_view",
    "affiliate_click",
  ]),
  creativeId: z.string().max(64).optional(),
  activityId: z.string().max(64).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const recentHits = new Map<string, number>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const last = recentHits.get(key) ?? 0;
  if (now - last < 250) {
    return true;
  }
  recentHits.set(key, now);
  if (recentHits.size > 5000) {
    recentHits.clear();
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const ua = request.headers.get("user-agent") ?? "unknown";
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const rateKey = `${ip}:${parsed.data.type}:${parsed.data.creativeId ?? ""}`;
    if (isRateLimited(rateKey)) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    await trackEvent({
      type: parsed.data.type as EventType,
      creativeId: parsed.data.creativeId,
      activityId: parsed.data.activityId,
      meta: {
        ...(parsed.data.meta ?? {}),
        ua: ua.slice(0, 180),
        referer: request.headers.get("referer")?.slice(0, 300) ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
