"use client";

import { Box, Button, Container, Flex, Separator } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { LanguageSelector } from "@/components/language-selector";
import { GuardedLink } from "@/components/navigation-blocker";
import { usePathname } from "@/i18n/navigation";

function HeaderBrand() {
  return (
    <BrandMark.Root>
      <BrandMark.Icon />
      <Box asChild display={{ initial: "none", sm: "inline" }}>
        <BrandMark.Name />
      </Box>
    </BrandMark.Root>
  );
}

export function AppHeader() {
  const t = useTranslations("common.navigation");
  const pathname = usePathname();
  const [skipFocused, setSkipFocused] = useState(false);
  const onHowItWorks = pathname === "/how-it-works";

  return (
    <>
      <Box position="fixed" top={skipFocused ? "2" : "-9"} left="2">
        <Button asChild size="2">
          <a
            href="#main-content"
            onFocus={() => setSkipFocused(true)}
            onBlur={() => setSkipFocused(false)}
          >
            {t("skipToContent")}
          </a>
        </Button>
      </Box>
      <Box asChild py="2">
        <header>
          <Container size="4" px={{ initial: "4", sm: "6" }}>
            <Flex align="center" justify="between" gap="3">
              <Button asChild size="2" variant="ghost" color="gray">
                <GuardedLink href="/journal" aria-label={t("brandLabel")}>
                  <HeaderBrand />
                </GuardedLink>
              </Button>

              <Flex align="center" gap={{ initial: "2", sm: "3" }} flexShrink="0">
                <Button asChild size="2" variant="ghost" color="gray">
                  <GuardedLink href={onHowItWorks ? "/journal" : "/how-it-works"}>
                    {onHowItWorks ? t("journal") : t("howItWorks")}
                  </GuardedLink>
                </Button>
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
