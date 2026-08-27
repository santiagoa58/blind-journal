import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import type { InitialAppSession } from "@/client-state/app-session.state";
import { routing } from "@/i18n/routing";
import { getCurrentUser } from "@/server/auth/current-user";
import { AppSessionInitializer } from "./app-session-initializer";

import "./globals.css";

const NEXT_INTL_LOCALE_HEADER = "x-next-intl-locale";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.variable}>
        <AppSessionInitializer initialSession={initialSession}>{children}</AppSessionInitializer>
      </body>
    </html>
  );
}
