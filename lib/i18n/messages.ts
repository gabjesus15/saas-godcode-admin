import de from "@/messages/de.json";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import it from "@/messages/it.json";
import pt from "@/messages/pt.json";

import { DEFAULT_LOCALE, type AppLocale } from "./config";

export type I18nMessages = typeof es;

const MESSAGES_BY_LOCALE: Record<AppLocale, I18nMessages> = {
  es,
  en,
  pt,
  fr,
  de,
  it,
};

export function getMessagesForLocale(locale: AppLocale): I18nMessages {
  return MESSAGES_BY_LOCALE[locale] ?? MESSAGES_BY_LOCALE[DEFAULT_LOCALE];
}
