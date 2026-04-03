import type { MetadataRoute } from "next";

import { getAppUrl } from "../lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login", "/onboarding"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
