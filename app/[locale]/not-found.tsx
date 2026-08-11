import { Button } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { StatusPage } from "@/components/status-page";
import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("error-page.notFound");
  const tCommon = useTranslations("common.actions");

  return (
    <StatusPage title={t("title")} description={t("description")}>
      <title>{t("title")}</title>
      <Button asChild size="3">
        <Link href="/">{tCommon("home")}</Link>
      </Button>
    </StatusPage>
  );
}
