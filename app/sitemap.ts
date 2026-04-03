import type { MetadataRoute } from "next";

import { getAppUrl } from "../lib/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  const now = new Date();
  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
