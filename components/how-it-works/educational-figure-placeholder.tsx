import { Card, Flex, Text } from "@radix-ui/themes";

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
      <Card size="4" variant="surface">
        <Flex
          align="center"
          justify="center"
          minHeight={{ initial: "12rem", md: "18rem" }}
          p={{ initial: "4", md: "6" }}
        >
          <Text size="2" color="gray" align="center">
            {placeholderLabel}
          </Text>
        </Flex>
      </Card>
      <Text asChild size="2" color="gray" mt="2">
        <figcaption>{caption}</figcaption>
      </Text>
    </figure>
  );
}
