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
import { messages } from "@/messages";

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
              {messages.common.labels.soon}
            </Badge>
          ) : null}
        </Flex>
        <Text as="p" size="1" color="gray" mt="1">
          {description}
        </Text>
      </Box>
      <Switch defaultChecked={defaultChecked} disabled={disabled} aria-label={title} />
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
  const copy = messages.privacy;

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
            <Dialog.Title mt="3">{copy.title}</Dialog.Title>
            <Dialog.Description size="2" color="gray" mt="1">
              {copy.description}
            </Dialog.Description>
          </Box>

          <Card size="3">
            <SettingRow
              icon={FaceIcon}
              title={copy.settings.biometricUnlock.title}
              description={copy.settings.biometricUnlock.description}
              defaultChecked
            />
            <Separator size="4" />
            <SettingRow
              icon={LockClosedIcon}
              title={copy.settings.autoLock.title}
              description={copy.settings.autoLock.description}
              defaultChecked
            />
            <Separator size="4" />
            <SettingRow
              icon={GlobeIcon}
              title={copy.settings.encryptedSync.title}
              description={copy.settings.encryptedSync.description}
              defaultChecked
            />
            <Separator size="4" />
            <SettingRow
              icon={LaptopIcon}
              title={copy.settings.trustedDevices.title}
              description={copy.settings.trustedDevices.description}
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
                  {copy.recovery.title}
                </Text>
                <Text as="p" size="1" color="gray" mt="1">
                  {copy.recovery.description}
                </Text>
                <Button mt="3" size="1" variant="surface">
                  {copy.recovery.action}
                </Button>
              </Box>
            </Flex>
          </Card>

          <Flex justify="end">
            <Dialog.Close>
              <Button>{messages.common.actions.done}</Button>
            </Dialog.Close>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
