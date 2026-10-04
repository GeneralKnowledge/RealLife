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
  creativeId: z.string().optional(),
  activityId: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await trackEvent({
      type: parsed.data.type as EventType,
      creativeId: parsed.data.creativeId,
      activityId: parsed.data.activityId,
      meta: parsed.data.meta,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
