import { defineRouting } from "next-intl/routing";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localeCookie: {
    name: LOCALE_COOKIE_NAME,
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
  },
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_NAMES = {
  en: "English",
  es: "Español",
} satisfies Record<Locale, string>;
