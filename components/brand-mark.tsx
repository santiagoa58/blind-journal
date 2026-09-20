import { Flex, Text, type TextProps } from "@radix-ui/themes";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { PropsWithChildren } from "react";

function BrandMarkRoot({ children }: PropsWithChildren) {
  return (
    <Flex align="center" gap="2">
      {children}
    </Flex>
  );
}

function BrandMarkIcon({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/brand/blind-journal-mark.svg"
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="eager"
    />
  );
}

function BrandMarkName(props: TextProps) {
  const t = useTranslations("brand");

  return (
    <Text size="3" weight="bold" {...props}>
      {t("name")}
    </Text>
  );
}

export const BrandMark = {
  Root: BrandMarkRoot,
  Icon: BrandMarkIcon,
  Name: BrandMarkName,
};
