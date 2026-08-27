import { LockClosedIcon } from "@radix-ui/react-icons";
import { Avatar, type AvatarProps, Flex, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { PropsWithChildren } from "react";

function BrandMarkRoot({ children }: PropsWithChildren) {
  return (
    <Flex align="center" gap="2">
      {children}
    </Flex>
  );
}

function BrandMarkAvatar(props: Omit<AvatarProps, "src" | "fallback">) {
  return (
    <Avatar
      size="2"
      radius="large"
      alt="Logo"
      {...props}
      src="/brand/blind-journal-mark.svg"
      fallback={<LockClosedIcon aria-hidden width={16} height={16} strokeWidth={2.25} />}
    />
  );
}
function BrandMarkName() {
  const t = useTranslations("brand");

  return (
    <Text size="3" weight="bold">
      {t("name")}
    </Text>
  );
}

export const BrandMark = {
  Root: BrandMarkRoot,
  Name: BrandMarkName,
  Avatar: BrandMarkAvatar,
};
