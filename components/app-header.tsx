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
  const t = useTranslations("how-it-works.navigation");
  const pathname = usePathname();

  if (pathname.startsWith("/journal")) {
    return null;
  }

  const isHowItWorks = pathname === "/how-it-works";

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

              <Flex asChild align="center" gap="2" flexShrink="0">
                <nav aria-label={t("pageNavigationLabel")}>
                  {isHowItWorks ? (
                    <Button asChild size="2">
                      <Link href="/journal">{t("openJournal")}</Link>
                    </Button>
                  ) : (
                    <Button asChild size="2" variant="ghost" color="gray">
                      <Link href="/how-it-works">{t("howItWorks")}</Link>
                    </Button>
                  )}
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
