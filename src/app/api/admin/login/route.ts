import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, assertAdminToken } from "@/lib/admin";

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
  response.cookies.set(ADMIN_COOKIE, parsed.data.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}
