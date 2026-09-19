"use client";

import { Box, Button, Container, Flex, Separator } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/brand-mark";
import { LanguageSelector } from "@/components/language-selector";
import { Link, usePathname } from "@/i18n/navigation";

function HeaderBrand() {
  return (
    <BrandMark.Root>
      <BrandMark.Avatar />
      <Box asChild display={{ initial: "none", sm: "inline" }}>
        <BrandMark.Name />
      </Box>
    </BrandMark.Root>
  );
}

export function AppHeader() {
  const t = useTranslations("common.navigation");
  const pathname = usePathname();

  if (pathname.startsWith("/journal")) {
    return null;
  }

  return (
    <>
      <Box asChild py="3">
        <header>
          <Container size="4" px={{ initial: "4", sm: "6" }}>
            <Flex align="center" justify="between" gap="3">
              <Button asChild size="2" variant="ghost" color="gray">
                <Link href="/" aria-label={t("homeLabel")}>
                  <HeaderBrand />
                </Link>
              </Button>

              <Flex asChild align="center" gap="1" flexShrink="0">
                <nav aria-label={t("label")}>
                  <Button asChild size="2" variant="ghost" color="gray">
                    <Link href="/how-it-works">{t("howItWorks")}</Link>
                  </Button>
                  <LanguageSelector compact />
                </nav>
              </Flex>
            </Flex>
          </Container>
        </header>
      </Box>
      <Separator size="4" />
    </>
  );
}
