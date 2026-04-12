"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { LOCALE_COOKIE_NAME, SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/config";

const LOCALE_AUTONYMS: Record<AppLocale, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
};

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    const nextLocale = value as AppLocale;
    if (!nextLocale || nextLocale === locale) return;

    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <label className={className}>
      <span className="sr-only">{t("language")}</span>
      <select
        title={t("language")}
        aria-label={t("language")}
        value={locale}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value)}
        className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        {SUPPORTED_LOCALES.map((item) => (
          <option key={item} value={item}>
            {LOCALE_AUTONYMS[item]}
          </option>
        ))}
      </select>
    </label>
  );
}
