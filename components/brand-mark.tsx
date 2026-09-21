import { Flex, Text, type TextProps } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { PropsWithChildren } from "react";

const PAGE_PATH = "M160 48h248c30.9 0 56 25.1 56 56v304c0 30.9-25.1 56-56 56H160V48Z";
const FOUR_SLATS =
  "M160 140h200l26 24H160zM160 212h200l26 24H160zM160 284h200l26 24H160zM160 356h200l26 24H160z";
const THREE_SLATS = "M160 156h200l30 30H160zM160 242h200l30 30H160zM160 328h200l30 30H160z";

function BrandMarkRoot({ children }: PropsWithChildren) {
  return (
    <Flex align="center" gap="2">
      {children}
    </Flex>
  );
}

function BrandMarkIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="var(--gray-12)"
        d="M104 48h32v416h-32c-30.9 0-56-25.1-56-56V104c0-30.9 25.1-56 56-56Z"
      />
      <path
        fill="var(--iris-9)"
        fillRule="evenodd"
        d={`${PAGE_PATH}${size <= 24 ? THREE_SLATS : FOUR_SLATS}`}
      />
    </svg>
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
