export const SUPPORTED_LOCALES = ["es", "en", "pt", "fr", "de", "it"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "es";
export const LOCALE_COOKIE_NAME = "godcode_locale";

const localeSet = new Set<string>(SUPPORTED_LOCALES);

export function normalizeLocale(value: unknown): AppLocale {
  const raw = String(value ?? "").trim().toLowerCase();
  if (localeSet.has(raw)) return raw as AppLocale;

  // Accept values like en-US / pt-BR and collapse to base locale.
  const base = raw.split("-")[0] ?? "";
  if (localeSet.has(base)) return base as AppLocale;

  return DEFAULT_LOCALE;
}
