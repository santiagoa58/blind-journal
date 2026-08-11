import { defineRouting } from "next-intl/routing";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localeCookie: {
    name: LOCALE_COOKIE_NAME,
  },
});

export type Locale = (typeof routing.locales)[number];
