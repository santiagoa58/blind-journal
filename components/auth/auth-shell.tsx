import { BrandMark } from "@/components/brand-mark";
import { LockClosedIcon } from "@radix-ui/react-icons";
import {
  Badge,
  Box,
  Callout,
  Card,
  Container,
  Grid,
  Heading,
  Section,
  Text,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { PropsWithChildren } from "react";

type AuthShellProps = PropsWithChildren;

export function AuthShell({ children }: AuthShellProps) {
  const t = useTranslations("auth");

  return (
    <Section size={{ initial: "2", md: "3" }} minHeight="100dvh">
      <Container size="4" px={{ initial: "4", sm: "6" }}>
        <Grid
          columns={{ initial: "1", md: "minmax(0, 1fr) minmax(0, 1fr)" }}
          gap={{ initial: "6", md: "8" }}
          align="center"
        >
          <Card size="4" variant="surface">
            <Grid gap={{ initial: "7", md: "9" }}>
              <BrandMark />

              <Box>
                <Badge variant="surface" color="iris" size="2">
                  {t("shell.simulationLabel")}
                </Badge>
                <Text as="p" size="2" weight="medium" color="iris" mt="6">
                  {t("shell.eyebrow")}
                </Text>
                <Heading
                  as="h1"
                  size={{ initial: "8", sm: "9" }}
                  mt="3"
                  wrap="balance"
                >
                  {t("shell.title")}
                </Heading>
                <Text as="p" size="4" color="gray" mt="4" wrap="pretty">
                  {t("shell.description")}
                </Text>
              </Box>

              <Callout.Root color="iris" variant="surface" size="2">
                <Callout.Icon>
                  <LockClosedIcon aria-hidden />
                </Callout.Icon>
                <Callout.Text>
                  <Text as="span" weight="bold">
                    {t("shell.privacyTitle")}{" "}
                  </Text>
                  <Text as="span" color="gray">
                    {t("shell.privacyDescription")}
                  </Text>
                </Callout.Text>
              </Callout.Root>
            </Grid>
          </Card>

          <Container size="1" width="100%">
            {children}
          </Container>
        </Grid>
      </Container>
    </Section>
  );
}
