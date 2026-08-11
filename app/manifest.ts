import type { MetadataRoute } from "next";
import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LOCALE_COOKIE_NAME, routing } from "@/i18n/routing";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const requestedLocale = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    id: "/",
    name: t("applicationName"),
    short_name: t("applicationName"),
    description: t("description"),
    lang: locale,
    start_url: `/${locale}`,
    scope: "/",
    display: "standalone",
    background_color: "#f0f0ff",
    theme_color: "#5b5bd6",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
