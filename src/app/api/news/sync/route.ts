import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { syncNewsFromProvider } from "@/lib/news";

const bodySchema = z
  .object({
    force: z.boolean().optional(),
  })
  .optional();

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let force = false;
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json: unknown = await request.json().catch(() => ({}));
      const parsed = bodySchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }
      force = Boolean(parsed.data?.force);
    }

    const result = await syncNewsFromProvider({ force });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "News sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
