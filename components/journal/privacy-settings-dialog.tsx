"use client";

import {
  CheckCircledIcon,
  FaceIcon,
  GlobeIcon,
  IdCardIcon,
  LaptopIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Separator,
  Switch,
  Text,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";

function SettingRow({
  icon: Icon,
  title,
  description,
  defaultChecked = false,
  disabled = false,
}: {
  icon: typeof GlobeIcon;
  title: string;
  description: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  const tCommon = useTranslations("common");

  return (
    <Flex align="start" gap="3" py="3">
      <Avatar
        size="2"
        radius="large"
        variant="soft"
        color="iris"
        fallback={<Icon aria-hidden width={16} height={16} />}
      />
      <Box flexGrow="1">
        <Flex align="center" gap="2">
          <Text size="2" weight="medium">
            {title}
          </Text>
          {disabled ? (
            <Badge color="gray" variant="outline">
              {tCommon("labels.soon")}
            </Badge>
          ) : null}
        </Flex>
        <Text as="p" size="1" color="gray" mt="1">
          {description}
        </Text>
      </Box>
      <Switch
        defaultChecked={defaultChecked}
        disabled={disabled}
        aria-label={title}
      />
    </Flex>
  );
}

export function PrivacySettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("privacy-settings");
  const tCommon = useTranslations("common");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="560px">
        <Flex direction="column" gap="4">
          <Box>
            <Avatar
              size="4"
              radius="large"
              variant="soft"
              color="iris"
              fallback={<CheckCircledIcon aria-hidden width={22} height={22} />}
            />
            <Dialog.Title mt="3">{t("title")}</Dialog.Title>
            <Dialog.Description size="2" color="gray" mt="1">
              {t("description")}
            </Dialog.Description>
          </Box>

          <Card size="3">
            <SettingRow
              icon={FaceIcon}
              title={t("settings.biometricUnlock.title")}
              description={t("settings.biometricUnlock.description")}
              defaultChecked
            />
            <Separator size="4" />
            <SettingRow
              icon={LockClosedIcon}
              title={t("settings.autoLock.title")}
              description={t("settings.autoLock.description")}
              defaultChecked
            />
            <Separator size="4" />
            <SettingRow
              icon={GlobeIcon}
              title={t("settings.encryptedSync.title")}
              description={t("settings.encryptedSync.description")}
              defaultChecked
            />
            <Separator size="4" />
            <SettingRow
              icon={LaptopIcon}
              title={t("settings.trustedDevices.title")}
              description={t("settings.trustedDevices.description")}
              defaultChecked
            />
          </Card>

          <Card size="3">
            <Flex align="start" gap="3">
              <Avatar
                size="2"
                radius="large"
                variant="soft"
                color="iris"
                fallback={<IdCardIcon aria-hidden width={16} height={16} />}
              />
              <Box flexGrow="1">
                <Text as="div" size="2" weight="medium">
                  {t("recovery.title")}
                </Text>
                <Text as="p" size="1" color="gray" mt="1">
                  {t("recovery.description")}
                </Text>
                <Button mt="3" size="1" variant="surface">
                  {t("recovery.action")}
                </Button>
              </Box>
            </Flex>
          </Card>

          <Flex justify="end">
            <Dialog.Close>
              <Button>{tCommon("actions.done")}</Button>
            </Dialog.Close>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
