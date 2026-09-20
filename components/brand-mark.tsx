import Image from "next/image";
import { Flex, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { PropsWithChildren } from "react";

type BrandMarkIconProps = {
  size?: number;
  priority?: boolean;
};

function BrandMarkRoot({ children }: PropsWithChildren) {
  return (
    <Flex align="center" gap="2">
      {children}
    </Flex>
  );
}

function BrandMarkIcon({ size = 28, priority = false }: BrandMarkIconProps) {
  return (
    <Image
      src="/brand/blind-journal-mark.svg"
      alt=""
      aria-hidden
      width={size}
      height={size}
      priority={priority}
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
  Icon: BrandMarkIcon,
  Name: BrandMarkName,
};
