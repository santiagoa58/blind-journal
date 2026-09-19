import { ImageIcon } from "@radix-ui/react-icons";
import { Avatar, Card, Flex, Text } from "@radix-ui/themes";

type EducationalFigurePlaceholderProps = {
  caption: string;
  placeholderLabel: string;
};

export function EducationalFigurePlaceholder({
  caption,
  placeholderLabel,
}: EducationalFigurePlaceholderProps) {
  return (
    <figure>
      <Card size="3" variant="surface">
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="3"
          minHeight={{ initial: "11rem", md: "16rem" }}
          p={{ initial: "4", md: "6" }}
        >
          <Avatar
            size="3"
            variant="soft"
            color="gray"
            fallback={<ImageIcon aria-hidden />}
          />
          <Text size="2" weight="medium" color="gray" align="center">
            {placeholderLabel}
          </Text>
        </Flex>
      </Card>
      <Text asChild size="2" color="gray" mt="2" align="center">
        <figcaption>{caption}</figcaption>
      </Text>
    </figure>
  );
}
