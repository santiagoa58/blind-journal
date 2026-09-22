import { Flex } from "@radix-ui/themes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppHeader } from "@/components/app-header";
import { AppLockBoundary } from "@/components/auth/app-lock-boundary";
import { DocumentLocale } from "@/components/document-locale";
import { NavigationBlockerProvider } from "@/components/navigation-blocker";
import { routing } from "@/i18n/routing";
import { Providers } from "../client-providers";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    applicationName: t("applicationName"),
    manifest: "/manifest.webmanifest",
    title: {
      default: t("title"),
      template: t("titleTemplate"),
    },
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return (
    <NextIntlClientProvider>
      <DocumentLocale locale={locale} />
      <Providers>
        <NavigationBlockerProvider>
          <Flex direction="column" height="100dvh" overflow="hidden">
            <AppHeader />
            <Flex direction="column" flexGrow="1" minHeight="0" overflow="auto">
              <AppLockBoundary>{children}</AppLockBoundary>
            </Flex>
          </Flex>
        </NavigationBlockerProvider>
      </Providers>
    </NextIntlClientProvider>
  );
}
