import type { Locale } from "@/i18n/routing";
import enCommon from "@/messages/en/common.json";
import enErrorPage from "@/messages/en/error-page.json";
import esCommon from "@/messages/es/common.json";
import esErrorPage from "@/messages/es/error-page.json";

const englishErrorPageMessages = {
  common: enCommon,
  "error-page": enErrorPage,
};

const errorPageMessagesByLocale = {
  en: englishErrorPageMessages,
  es: {
    common: esCommon,
    "error-page": esErrorPage,
  } satisfies typeof englishErrorPageMessages,
} satisfies Record<Locale, typeof englishErrorPageMessages>;

export function getErrorPageMessages(locale: Locale): typeof englishErrorPageMessages {
  return errorPageMessagesByLocale[locale];
}
