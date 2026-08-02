import { LockClosedIcon } from "@radix-ui/react-icons";
import { Avatar, Flex, Heading } from "@radix-ui/themes";
import { useTranslations } from "next-intl";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("brand");

  return (
    <Flex align="center" gap="2">
      <Avatar
        size="2"
        radius="large"
        src="/brand/blind-journal-mark.svg"
        fallback={<LockClosedIcon aria-hidden width={16} height={16} strokeWidth={2.25} />}
      />
      {compact ? null : (
        <Heading as="h2" size="3" weight="medium">
          {t("name")}
        </Heading>
      )}
    </Flex>
  );
}
