import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, adminCookieOptions, assertAdminToken } from "@/lib/admin";

const bodySchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  const json: unknown = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success || !assertAdminToken(parsed.data.token)) {
    return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, parsed.data.token, adminCookieOptions());
  return response;
}
