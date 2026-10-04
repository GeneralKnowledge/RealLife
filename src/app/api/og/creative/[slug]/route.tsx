import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const SIZES = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  og: { width: 1200, height: 630 },
} as const;

type Format = keyof typeof SIZES;

function parseFormat(value: string | null): Format {
  if (value === "story" || value === "og" || value === "square") return value;
  return "square";
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const format = parseFormat(new URL(request.url).searchParams.get("format"));
  const size = SIZES[format];

  const creative = await prisma.creative.findUnique({ where: { slug } });
  if (!creative) {
    return new Response("Not found", { status: 404 });
  }

  const headlineSize = format === "og" ? 56 : format === "story" ? 72 : 64;
  const pad = format === "og" ? 48 : 64;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0f1410",
          backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url(${creative.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          padding: pad,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 4,
            color: "#e0c07a",
            fontWeight: 700,
          }}
        >
          GET OUTSIDE
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 3,
              color: "#c6a15b",
              textTransform: "uppercase",
            }}
          >
            {creative.locationLine ?? "Scotland"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: headlineSize,
              fontWeight: 800,
              lineHeight: 1.05,
              textTransform: "uppercase",
              maxWidth: format === "og" ? 900 : 980,
            }}
          >
            {creative.headline}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.8)" }}>
            {creative.priceLine}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 8,
              backgroundColor: "#c6a15b",
              color: "#1a160c",
              padding: "14px 28px",
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              width: "auto",
              alignSelf: "flex-start",
            }}
          >
            {creative.ctaLabel}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
