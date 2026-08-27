import { ChevronDownIcon, ExitIcon, GlobeIcon } from "@radix-ui/react-icons";
import { Avatar, Box, Button, DropdownMenu, Grid, IconButton, Text } from "@radix-ui/themes";
import { hasLocale, useLocale, useTranslations } from "next-intl";
import type { ClientUser } from "@/api/auth/user.type";
import { LOCALE_NAMES, type Locale, routing } from "@/i18n/routing";

type JournalAccountMenuProps = {
  compact?: boolean;
  currentUser: ClientUser;
  onLocaleChange: (locale: Locale) => void;
  onSignOut: () => void;
};

export function JournalAccountMenu({
  compact = false,
  currentUser,
  onLocaleChange,
  onSignOut,
}: JournalAccountMenuProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const avatar = (
    <Avatar
      size="2"
      variant="solid"
      color="iris"
      fallback={<span aria-hidden>{currentUser.displayName.charAt(0).toUpperCase()}</span>}
    />
  );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {compact ? (
          <IconButton size="2" variant="surface" color="iris" aria-label={t("account.menuLabel")}>
            {avatar}
          </IconButton>
        ) : (
          <Box asChild width="100%">
            <Button variant="ghost" color="gray" size="2">
              <Grid columns="auto minmax(0, 1fr) auto" align="center" gap="2" width="100%">
                {avatar}
                <Text truncate align="left">
                  {currentUser.displayName}
                </Text>
                <ChevronDownIcon aria-hidden />
              </Grid>
            </Button>
          </Box>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start" side={compact ? "bottom" : "top"}>
        <DropdownMenu.Label>{currentUser.username}</DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>
            <GlobeIcon aria-hidden />
            {tCommon("labels.currentLanguage", { language: LOCALE_NAMES[locale] })}
          </DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <DropdownMenu.RadioGroup
              value={locale}
              onValueChange={(nextLocale) => {
                if (hasLocale(routing.locales, nextLocale)) {
                  onLocaleChange(nextLocale);
                }
              }}
            >
              {routing.locales.map((supportedLocale) => (
                <DropdownMenu.RadioItem key={supportedLocale} value={supportedLocale}>
                  {LOCALE_NAMES[supportedLocale]}
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
        <DropdownMenu.Separator />
        <DropdownMenu.Item color="red" onSelect={onSignOut}>
          <ExitIcon aria-hidden />
          {t("account.signOut")}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
