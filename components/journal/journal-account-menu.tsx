import { ChevronDownIcon, ExitIcon } from "@radix-ui/react-icons";
import { Avatar, Box, Button, DropdownMenu, Grid, IconButton, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { ClientUser } from "@/lib/api/auth/user.type";

type JournalAccountMenuProps = {
  compact?: boolean;
  currentUser: ClientUser;
  onSignOut: () => void;
};

export function JournalAccountMenu({
  compact = false,
  currentUser,
  onSignOut,
}: JournalAccountMenuProps) {
  const t = useTranslations("sidebar");
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
          <IconButton size="3" variant="surface" color="iris" aria-label={t("account.menuLabel")}>
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
        <DropdownMenu.Item color="red" onSelect={onSignOut}>
          <ExitIcon aria-hidden />
          {t("account.signOut")}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
