"use client"

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
} from "@radix-ui/themes"
import {
  CheckCircledIcon,
  FaceIcon,
  GlobeIcon,
  IdCardIcon,
  LaptopIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons"

function SettingRow({
  icon: Icon,
  title,
  description,
  defaultChecked = false,
  disabled = false,
}: {
  icon: typeof GlobeIcon
  title: string
  description: string
  defaultChecked?: boolean
  disabled?: boolean
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
              Soon
            </Badge>
          ) : null}
        </Flex>
        <Text as="p" size="1" color="gray" mt="1">
          {description}
        </Text>
      </Box>
      <Switch defaultChecked={defaultChecked} disabled={disabled} aria-label={title} />
    </Flex>
  )
}

export function PrivacySettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
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
            <Dialog.Title mt="3">Privacy and security</Dialog.Title>
            <Dialog.Description size="2" color="gray" mt="1">
              Visual settings for how Blind Journal protects and unlocks your private writing.
            </Dialog.Description>
          </Box>

          <Card size="3">
            <SettingRow
              icon={FaceIcon}
              title="Biometric unlock"
              description="Use Touch ID or your device biometrics after your first unlock."
              defaultChecked
            />
            <Separator size="4" />
            <SettingRow
              icon={LockClosedIcon}
              title="Auto-lock"
              description="Lock the journal after five minutes of inactivity."
              defaultChecked
            />
            <Separator size="4" />
            <SettingRow
              icon={GlobeIcon}
              title="Encrypted sync"
              description="Sync encrypted journal data across your trusted devices."
              defaultChecked
            />
            <Separator size="4" />
            <SettingRow
              icon={LaptopIcon}
              title="Trusted devices"
              description="Require approval before a new device can access your journal."
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
                  Recovery key
                </Text>
                <Text as="p" size="1" color="gray" mt="1">
                  Blind Journal cannot read or recover your entries. Keep your recovery key somewhere safe.
                </Text>
                <Button mt="3" size="1" variant="surface">
                  View recovery options
                </Button>
              </Box>
            </Flex>
          </Card>

          <Flex justify="end">
            <Dialog.Close>
              <Button>Done</Button>
            </Dialog.Close>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
