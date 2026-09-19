"use client";

import { Box, Button, Container, Flex, Separator, TabNav } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/brand-mark";
import { LanguageSelector } from "@/components/language-selector";
import { GuardedLink } from "@/components/navigation-blocker";
import { usePathname } from "@/i18n/navigation";

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

  return (
    <>
      <Box asChild py="3">
        <header>
          <Container size="4" px={{ initial: "4", sm: "6" }}>
            <Flex align="center" justify="between" gap="3">
              <Button asChild size="2" variant="ghost" color="gray">
                <GuardedLink href="/" aria-label={t("homeLabel")}>
                  <HeaderBrand />
                </GuardedLink>
              </Button>

              <Flex align="center" gap={{ initial: "2", sm: "3" }} flexShrink="0">
                <TabNav.Root size={{ initial: "1", sm: "2" }} aria-label={t("label")}>
                  <TabNav.Link asChild active={pathname === "/journal"}>
                    <GuardedLink href="/journal">{t("journal")}</GuardedLink>
                  </TabNav.Link>
                  <TabNav.Link asChild active={pathname === "/how-it-works"}>
                    <GuardedLink href="/how-it-works">{t("howItWorks")}</GuardedLink>
                  </TabNav.Link>
                </TabNav.Root>
                <Separator orientation="vertical" size="2" />
                <LanguageSelector compact />
              </Flex>
            </Flex>
          </Container>
        </header>
      </Box>
      <Separator size="4" />
    </>
  );
}
