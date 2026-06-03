import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/help", "/demo", "/pricing", "/features"],
        disallow: ["/api/", "/_next/", "/static/"],
      },
    ],
    sitemap: "https://torpo.co.il/sitemap.xml",
  };
}
