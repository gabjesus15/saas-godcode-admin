import type { MetadataRoute } from "next";

import { getAppUrl } from "../lib/app-url";
import { SUPPORTED_LOCALES } from "../lib/i18n/config";

const DEFAULT_SITEMAP_LAST_MODIFIED = "2026-04-17T00:00:00.000Z";

function getSitemapLastModified(): Date {
  const fromEnv = process.env.NEXT_PUBLIC_SITEMAP_LAST_MODIFIED?.trim();
  const date = fromEnv ? new Date(fromEnv) : new Date(DEFAULT_SITEMAP_LAST_MODIFIED);
  return Number.isNaN(date.getTime()) ? new Date(DEFAULT_SITEMAP_LAST_MODIFIED) : date;
}

function buildLanguageAlternates(base: string, path: string): Record<string, string> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, `${base}${normalizedPath}?hl=${locale}`]),
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  const lastModified = getSitemapLastModified();

  return [
    {
      url: `${base}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: buildLanguageAlternates(base, "/"),
      },
    },
    {
      url: `${base}/sobre-godcode`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: buildLanguageAlternates(base, "/sobre-godcode"),
      },
    },
    {
      url: `${base}/onboarding`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: {
        languages: buildLanguageAlternates(base, "/onboarding"),
      },
    },
    {
      url: `${base}/onboarding/negocios`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: {
        languages: buildLanguageAlternates(base, "/onboarding/negocios"),
      },
    },
    {
      url: `${base}/onboarding/terminos`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: {
        languages: buildLanguageAlternates(base, "/onboarding/terminos"),
      },
    },
    {
      url: `${base}/onboarding/privacidad`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: {
        languages: buildLanguageAlternates(base, "/onboarding/privacidad"),
      },
    },
  ];
}
