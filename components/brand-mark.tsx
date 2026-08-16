import { LockClosedIcon } from "@radix-ui/react-icons";
import { Avatar, Flex, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";

export function BrandMark() {
  const t = useTranslations("brand");

  return (
    <Flex align="center" gap="2">
      <Avatar
        size="2"
        radius="large"
        src="/brand/blind-journal-mark.svg"
        alt={`${t("name")} logo`}
        fallback={<LockClosedIcon aria-hidden width={16} height={16} strokeWidth={2.25} />}
      />
      <Text size="3" weight="bold">
        {t("name")}
      </Text>
    </Flex>
  );
}
