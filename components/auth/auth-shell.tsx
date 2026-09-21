import { LockClosedIcon } from "@radix-ui/react-icons";
import { Box, Container, Flex, Grid, Section, Text } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { PropsWithChildren } from "react";

type AuthShellProps = PropsWithChildren;

export function AuthShell({ children }: AuthShellProps) {
  const t = useTranslations("auth");

  return (
    <Section size={{ initial: "2", md: "3" }} flexGrow="1">
      <Container size="4" px={{ initial: "4", sm: "6" }}>
        <Grid
          columns={{ initial: "1", md: "minmax(0, 1fr) minmax(0, 1fr)" }}
          gap={{ initial: "6", md: "8" }}
          align="center"
        >
          <Box display={{ initial: "none", md: "block" }}>
            <Flex direction="column" gap="5" maxWidth="28rem">
              <Box>
                <Text as="p" size="2" weight="medium" color="iris">
                  {t("shell.eyebrow")}
                </Text>
                <Text as="p" size={{ initial: "7", lg: "8" }} weight="bold" mt="3" wrap="balance">
                  {t("shell.title")}
                </Text>
                <Text as="p" size="3" color="gray" mt="3" wrap="pretty">
                  {t("shell.description")}
                </Text>
              </Box>
              <Flex align="start" gap="3">
                <Box pt="1">
                  <Text as="span" color="iris">
                    <LockClosedIcon aria-hidden />
                  </Text>
                </Box>
                <Text as="p" size="2" color="gray" wrap="pretty">
                  <Text as="span" weight="bold" color="gray">
                    {t("shell.privacyTitle")}{" "}
                  </Text>
                  {t("shell.privacyDescription")}
                </Text>
              </Flex>
            </Flex>
          </Box>

          <Container size="1" width="100%">
            {children}
          </Container>
        </Grid>
      </Container>
    </Section>
  );
}
