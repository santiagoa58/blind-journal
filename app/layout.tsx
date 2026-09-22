import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { InitialAppSession } from "@/client-state/app-session.state";
import { routing } from "@/i18n/routing";
import { getCurrentUser } from "@/server/auth/current-user";
import { appFont } from "./app-font";
import { AppSessionInitializer } from "./app-session-initializer";
import { AppThemeProvider } from "./app-theme-provider";

import "./globals.css";

const NEXT_INTL_LOCALE_HEADER = "x-next-intl-locale";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({ children }: Readonly<React.PropsWithChildren>) {
  const [requestHeaders, currentUser] = await Promise.all([headers(), getCurrentUser()]);
  const requestedLocale = requestHeaders.get(NEXT_INTL_LOCALE_HEADER);
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const initialSession: InitialAppSession = currentUser
    ? { status: "locked", user: currentUser }
    : { status: "signed-out" };
  const t = await getTranslations({ locale, namespace: "common.labels" });
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={appFont.variable}>
        <AppThemeProvider nonce={nonce}>
          <AppSessionInitializer initialSession={initialSession} loadingLabel={t("loading")}>
            {children}
          </AppSessionInitializer>
        </AppThemeProvider>
      </body>
    </html>
  );
}
