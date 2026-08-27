import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DocumentLocale } from "@/components/document-locale";
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
  const [{ locale }, requestHeaders] = await Promise.all([params, headers()]);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  return (
    <NextIntlClientProvider>
      <DocumentLocale locale={locale} />
      <Providers nonce={nonce}>{children}</Providers>
    </NextIntlClientProvider>
  );
}
