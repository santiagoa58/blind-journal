import { LockClosedIcon } from "@radix-ui/react-icons";
import { Avatar, Flex, Heading } from "@radix-ui/themes";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Flex align="center" gap="2">
      <Avatar
        size="2"
        radius="large"
        src="/brand/blind-journal-mark.svg"
        fallback={
          <LockClosedIcon
            aria-hidden
            width={16}
            height={16}
            strokeWidth={2.25}
          />
        }
      />
      {compact ? null : (
        <Heading as="h2" size="3" weight="medium">
          Blind Journal
        </Heading>
      )}
    </Flex>
  );
}
