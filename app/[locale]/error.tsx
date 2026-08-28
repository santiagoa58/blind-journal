"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { UnexpectedErrorPage } from "@/components/unexpected-error-page";
import { reportClientError } from "@/lib/client.error";

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  const t = useTranslations("error-page.unexpected");

  useEffect(() => reportClientError(error), [error]);

  return (
    <>
      <title>{t("title")}</title>
      <UnexpectedErrorPage onRetry={retry} />
    </>
  );
}
