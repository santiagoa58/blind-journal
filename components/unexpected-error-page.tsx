"use client";

import { Button } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { StatusPage } from "@/components/status-page";

type UnexpectedErrorPageProps = {
  onRetry: () => void;
};

export function UnexpectedErrorPage({ onRetry }: UnexpectedErrorPageProps) {
  const t = useTranslations("error-page.unexpected");
  const tCommon = useTranslations("common.actions");

  return (
    <StatusPage title={t("title")} description={t("description")}>
      <title>{t("title")}</title>
      <Button type="button" size="3" onClick={onRetry}>
        {tCommon("retry")}
      </Button>
    </StatusPage>
  );
}
