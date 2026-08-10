import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const PRIVATE_ROUTES = ["/dashboard/", "/editor/", "/api/", "/login", "/signup", "/p/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_ROUTES,
      },
      // Search and citation crawlers can discover public marketing content.
      ...["OAI-SearchBot", "PerplexityBot", "Claude-SearchBot", "ChatGPT-User"].map(
        (userAgent) => ({
          userAgent,
          allow: "/",
          disallow: PRIVATE_ROUTES,
        })
      ),
      // Keep public content out of model-training crawls while preserving search visibility.
      ...["GPTBot", "CCBot", "Google-Extended", "ClaudeBot"].map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
