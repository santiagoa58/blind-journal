"use client";

import { GlobeIcon } from "@radix-ui/react-icons";
import { Flex, Select, Text } from "@radix-ui/themes";
import { hasLocale, useLocale, useTranslations } from "next-intl";
import { useId } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_NAMES, routing } from "@/i18n/routing";

export function LanguageSelector() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const selectId = useId();

  function selectLocale(nextLocale: string) {
    if (!hasLocale(routing.locales, nextLocale) || nextLocale === locale) {
      return;
    }

    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <Flex align="center" gap="2">
      <GlobeIcon aria-hidden />
      <Text as="label" htmlFor={selectId} size="2" color="gray">
        {t("labels.language")}
      </Text>
      <Select.Root value={locale} size="2" onValueChange={selectLocale}>
        <Select.Trigger id={selectId} variant="soft" aria-label={t("labels.language")}>
          {LOCALE_NAMES[locale]}
        </Select.Trigger>
        <Select.Content position="popper" align="end">
          {routing.locales.map((supportedLocale) => (
            <Select.Item key={supportedLocale} value={supportedLocale}>
              {LOCALE_NAMES[supportedLocale]}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}
