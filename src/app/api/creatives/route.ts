import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminToken } from "@/lib/admin";
import { createCreativeFromActivity } from "@/lib/creatives";

const bodySchema = z.object({
  activityId: z.string().min(1),
});

export async function POST(request: Request) {
  const token = request.headers.get("x-admin-token");
  if (!assertAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const creative = await createCreativeFromActivity(parsed.data.activityId);
    return NextResponse.json({ creative });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create creative";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
