import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { setNewsItemStatus } from "@/lib/news";

const bodySchema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(["draft", "published", "hidden"]),
});

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const item = await setNewsItemStatus(parsed.data.id, parsed.data.status);
    return NextResponse.json({ ok: true, id: item.id, status: item.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
