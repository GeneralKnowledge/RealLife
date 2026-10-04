import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { syncActivitiesFromProvider } from "@/lib/activities";

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncActivitiesFromProvider({ limit: 40 });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
