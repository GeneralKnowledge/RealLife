import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminToken } from "@/lib/admin";
import { createCreativeFromActivity } from "@/lib/creatives";
import { generateSocialPostsForCreative } from "@/lib/social";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  creativeId: z.string().optional(),
  activityId: z.string().optional(),
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

    let creativeId = parsed.data.creativeId;

    if (!creativeId && parsed.data.activityId) {
      const creative = await createCreativeFromActivity(parsed.data.activityId);
      return NextResponse.json({
        creative,
        socialPosts: creative.socialPosts,
      });
    }

    if (!creativeId) {
      return NextResponse.json(
        { error: "creativeId or activityId is required" },
        { status: 400 },
      );
    }

    const exists = await prisma.creative.findUnique({ where: { id: creativeId } });
    if (!exists) {
      return NextResponse.json({ error: "Creative not found" }, { status: 404 });
    }

    const socialPosts = await generateSocialPostsForCreative(creativeId);
    return NextResponse.json({ creativeId, socialPosts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate social posts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
