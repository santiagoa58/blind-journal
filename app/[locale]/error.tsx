"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { reportClientError } from "@/client.error";
import { UnexpectedErrorPage } from "@/components/unexpected-error-page";

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
