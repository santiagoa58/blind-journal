import { Card, Container, Flex, Heading, Text } from "@radix-ui/themes";
import type { PropsWithChildren } from "react";

type StatusPageProps = PropsWithChildren<{
  description: string;
  title: string;
}>;

export function StatusPage({ children, description, title }: StatusPageProps) {
  return (
    <Flex asChild align="center" justify="center" minHeight="100dvh" p="4">
      <main>
        <Container size="1" width="100%">
          <Card size="4" variant="surface">
            <Flex direction="column" align="center" gap="3">
              <Heading as="h1" size="7" align="center">
                {title}
              </Heading>
              <Text as="p" color="gray" align="center" wrap="pretty">
                {description}
              </Text>
              {children}
            </Flex>
          </Card>
        </Container>
      </main>
    </Flex>
  );
}
