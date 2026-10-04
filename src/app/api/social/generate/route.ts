import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createCreativeFromActivity } from "@/lib/creatives";
import { generateSocialPostsForCreative } from "@/lib/social";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  creativeId: z.string().optional(),
  activityId: z.string().optional(),
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

    if (!parsed.data.creativeId && parsed.data.activityId) {
      const result = await createCreativeFromActivity(parsed.data.activityId);
      return NextResponse.json({
        creative: result.creative,
        socialPosts: result.creative.socialPosts,
        contentMode: result.contentMode,
        socialMode: result.socialMode,
      });
    }

    if (!parsed.data.creativeId) {
      return NextResponse.json(
        { error: "creativeId or activityId is required" },
        { status: 400 },
      );
    }

    const exists = await prisma.creative.findUnique({
      where: { id: parsed.data.creativeId },
    });
    if (!exists) {
      return NextResponse.json({ error: "Creative not found" }, { status: 404 });
    }

    const { posts, mode } = await generateSocialPostsForCreative(parsed.data.creativeId);
    return NextResponse.json({
      creativeId: parsed.data.creativeId,
      socialPosts: posts,
      socialMode: mode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate social posts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
