"use client";

import "@radix-ui/themes/styles.css";
import "./globals.css";

import { useParams } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { useEffect } from "react";
import { UnexpectedErrorPage } from "@/components/unexpected-error-page";
import { getErrorPageMessages } from "@/i18n/error-page-messages";
import { routing } from "@/i18n/routing";
import { reportClientError } from "@/lib/client.error";
import { appFont } from "./app-font";
import { AppThemeProvider } from "./client-providers";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function GlobalErrorPage({ error, retry }: GlobalErrorPageProps) {
  const params = useParams<{ locale?: string | string[] }>();
  const requestedLocale = params.locale;
  const locale =
    typeof requestedLocale === "string" && hasLocale(routing.locales, requestedLocale)
      ? requestedLocale
      : routing.defaultLocale;
  const messages = getErrorPageMessages(locale);

  useEffect(() => reportClientError(error), [error]);

  return (
    <html lang={locale}>
      <head>
        <title>{messages["error-page"].unexpected.title}</title>
      </head>
      <body className={appFont.variable}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppThemeProvider>
            <UnexpectedErrorPage onRetry={retry} />
          </AppThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
