import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/escape/", "/c/"],
      disallow: ["/admin", "/api/"],
    },
    sitemap: appUrl("/sitemap.xml"),
  };
}
