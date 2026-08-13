"use client";

import { useTranslations } from "next-intl";
import { UnexpectedErrorPage } from "@/components/unexpected-error-page";

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  const t = useTranslations("error-page.unexpected");

  return (
    <>
      <title>{t("title")}</title>
      <UnexpectedErrorPage onRetry={reset} />
    </>
  );
}
