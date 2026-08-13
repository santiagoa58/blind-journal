"use client";

import "@radix-ui/themes/styles.css";
import "./globals.css";

import { Theme } from "@radix-ui/themes";
import { useParams } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { UnexpectedErrorPage } from "@/components/unexpected-error-page";
import { getErrorPageMessages } from "@/i18n/error-page-messages";
import { routing } from "@/i18n/routing";

type GlobalErrorPageProps = {
  reset: () => void;
};

export default function GlobalErrorPage({ reset }: GlobalErrorPageProps) {
  const params = useParams<{ locale?: string | string[] }>();
  const requestedLocale = params.locale;
  const locale =
    typeof requestedLocale === "string" && hasLocale(routing.locales, requestedLocale)
      ? requestedLocale
      : routing.defaultLocale;
  const messages = getErrorPageMessages(locale);

  return (
    <html lang={locale}>
      <head>
        <title>{messages["error-page"].unexpected.title}</title>
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Theme accentColor="iris" grayColor="slate" radius="large">
            <UnexpectedErrorPage onRetry={reset} />
          </Theme>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
