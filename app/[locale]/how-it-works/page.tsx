import { EyeOpenIcon, LockClosedIcon } from "@radix-ui/react-icons";
import {
  Avatar,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Section,
  Separator,
  Text,
} from "@radix-ui/themes";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import authenticationFlow from "@/assets/how-it-works/authentication-flow.webp";
import journalSaveFlow from "@/assets/how-it-works/journal-save-flow.webp";
import localEncryptionFlow from "@/assets/how-it-works/local-encryption-flow.webp";
import systemArchitecture from "@/assets/how-it-works/system-architecture.webp";
import type { Locale } from "@/i18n/routing";
import styles from "./how-it-works.module.css";

type HowItWorksPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: HowItWorksPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "how-it-works.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function HowItWorksPage({ params }: HowItWorksPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("how-it-works");

  return (
    <main>
      <Section size="3">
        <Container size="3" px={{ initial: "4", sm: "6" }}>
          <Flex direction="column" align="center" gap="4">
            <Text size="2" weight="medium" color="iris">
              {t("hero.eyebrow")}
            </Text>
            <Container size="2">
              <Heading as="h1" size={{ initial: "8", sm: "9" }} align="center">
                {t("hero.title")}
              </Heading>
            </Container>
            <Container size="2">
              <Text as="p" size="4" color="gray" align="center" wrap="pretty">
                {t("hero.body")}
              </Text>
            </Container>
          </Flex>
        </Container>
      </Section>

      <Container size="4" px={{ initial: "4", sm: "6" }}>
        <Separator size="4" />
      </Container>

      <Section size="3" aria-labelledby="how-it-works-big-picture">
        <Container size="4" px={{ initial: "4", sm: "6" }}>
          <Grid
            columns={{ initial: "1", md: "5fr 7fr" }}
            gap={{ initial: "6", md: "8" }}
            align="center"
          >
            <Flex direction="column" gap="3">
              <Text size="2" weight="medium" color="iris">
                {t("sections.bigPicture.eyebrow")}
              </Text>
              <Heading id="how-it-works-big-picture" as="h2" size="7">
                {t("sections.bigPicture.title")}
              </Heading>
              <Text as="p" size="3" color="gray" wrap="pretty">
                {t("sections.bigPicture.body")}
              </Text>
              <Flex direction="column" gap="1">
                <Text as="p" size="3" weight="medium">
                  {t("sections.bigPicture.httpsTitle")}
                </Text>
                <Text as="p" size="3" color="gray" wrap="pretty">
                  {t("sections.bigPicture.httpsBody")}
                </Text>
              </Flex>
            </Flex>

            <Box asChild m="0" minWidth="0" width="100%">
              <figure>
                <Image
                  className={styles["figureImage"]}
                  src={localEncryptionFlow}
                  alt={t("figures.bigPictureAlt")}
                  sizes="(min-width: 1024px) 58vw, 100vw"
                />
              </figure>
            </Box>
          </Grid>
        </Container>
      </Section>

      <Section size="2" aria-labelledby="how-it-works-authentication">
        <Container size="4" px={{ initial: "4", sm: "6" }}>
          <Flex
            direction={{ initial: "column", md: "row-reverse" }}
            gap={{ initial: "6", md: "8" }}
            align="center"
          >
            <Box width={{ initial: "100%", md: "42%" }}>
              <Flex direction="column" gap="3">
                <Text size="2" weight="medium" color="iris">
                  {t("sections.authentication.eyebrow")}
                </Text>
                <Heading id="how-it-works-authentication" as="h2" size="7">
                  {t("sections.authentication.title")}
                </Heading>
                <Text as="p" size="3" color="gray" wrap="pretty">
                  {t("sections.authentication.body")}
                </Text>
                <Text as="p" size="3" color="gray" wrap="pretty">
                  {t("sections.authentication.separationBody")}
                </Text>
              </Flex>
            </Box>

            <Box asChild m="0" minWidth="0" width={{ initial: "100%", md: "58%" }}>
              <figure>
                <Image
                  className={styles["figureImage"]}
                  src={authenticationFlow}
                  alt={t("figures.authenticationAlt")}
                  sizes="(min-width: 1024px) 58vw, 100vw"
                />
              </figure>
            </Box>
          </Flex>
        </Container>
      </Section>

      <Section size="2" aria-labelledby="how-it-works-saving">
        <Container size="4" px={{ initial: "4", sm: "6" }}>
          <Flex direction="column" gap={{ initial: "5", md: "6" }}>
            <Container size="2">
              <Flex direction="column" gap="4">
                <Flex direction="column" align="center" gap="3">
                  <Text size="2" weight="medium" color="iris">
                    {t("sections.saving.eyebrow")}
                  </Text>
                  <Heading id="how-it-works-saving" as="h2" size="7" align="center">
                    {t("sections.saving.title")}
                  </Heading>
                </Flex>
                <Flex direction="column" gap="3">
                  <Text as="p" size="3" color="gray" wrap="pretty">
                    {t("sections.saving.body")}
                  </Text>
                  <Text as="p" size="3" color="gray" wrap="pretty">
                    {t("sections.saving.storageBody")}
                  </Text>
                </Flex>
              </Flex>
            </Container>

            <Box asChild my="0" mx="auto" minWidth="0" width="100%" maxWidth="52rem">
              <figure>
                <Image
                  className={styles["figureImage"]}
                  src={journalSaveFlow}
                  alt={t("figures.savingAlt")}
                  sizes="(min-width: 1024px) 52rem, 100vw"
                />
              </figure>
            </Box>

            <Container size="2">
              <Flex direction="column" gap="2">
                <Heading as="h3" size="4">
                  {t("sections.saving.openingTitle")}
                </Heading>
                <Text as="p" size="3" color="gray" wrap="pretty">
                  {t("sections.saving.openingBody")}
                </Text>
              </Flex>
            </Container>
          </Flex>
        </Container>
      </Section>

      <Section size="2" aria-labelledby="how-it-works-visibility">
        <Container size="4" px={{ initial: "4", sm: "6" }}>
          <Flex direction="column" gap={{ initial: "5", md: "6" }}>
            <Container size="2">
              <Flex direction="column" gap="3">
                <Text size="2" weight="medium" color="iris">
                  {t("sections.visibility.eyebrow")}
                </Text>
                <Heading id="how-it-works-visibility" as="h2" size="7">
                  {t("sections.visibility.title")}
                </Heading>
                <Text as="p" size="3" color="gray" wrap="pretty">
                  {t("sections.visibility.body")}
                </Text>
              </Flex>
            </Container>

            <Grid columns={{ initial: "1", md: "2" }} gap="4">
              <Card size="4" variant="surface">
                <Flex direction="column" gap="4" height="100%">
                  <Avatar
                    size="3"
                    variant="soft"
                    color="gray"
                    fallback={<EyeOpenIcon aria-hidden />}
                  />
                  <Flex direction="column" gap="2">
                    <Heading as="h3" size="5">
                      {t("sections.visibility.observableTitle")}
                    </Heading>
                    <Flex asChild direction="column" gap="3" m="0" pl="4">
                      <ul>
                        <Text asChild size="3" color="gray">
                          <li>{t("sections.visibility.observable.identity")}</li>
                        </Text>
                        <Text asChild size="3" color="gray">
                          <li>{t("sections.visibility.observable.authentication")}</li>
                        </Text>
                        <Text asChild size="3" color="gray">
                          <li>{t("sections.visibility.observable.records")}</li>
                        </Text>
                        <Text asChild size="3" color="gray">
                          <li>{t("sections.visibility.observable.operations")}</li>
                        </Text>
                      </ul>
                    </Flex>
                  </Flex>
                </Flex>
              </Card>

              <Card size="4" variant="surface">
                <Flex direction="column" gap="4" height="100%">
                  <Avatar
                    size="3"
                    variant="soft"
                    color="iris"
                    fallback={<LockClosedIcon aria-hidden />}
                  />
                  <Flex direction="column" gap="2">
                    <Heading as="h3" size="5">
                      {t("sections.visibility.privateTitle")}
                    </Heading>
                    <Flex asChild direction="column" gap="3" m="0" pl="4">
                      <ul>
                        <Text asChild size="3" color="gray">
                          <li>{t("sections.visibility.private.passphrase")}</li>
                        </Text>
                        <Text asChild size="3" color="gray">
                          <li>{t("sections.visibility.private.journalKey")}</li>
                        </Text>
                        <Text asChild size="3" color="gray">
                          <li>{t("sections.visibility.private.entryKeys")}</li>
                        </Text>
                        <Text asChild size="3" color="gray">
                          <li>{t("sections.visibility.private.plaintext")}</li>
                        </Text>
                      </ul>
                    </Flex>
                  </Flex>
                </Flex>
              </Card>
            </Grid>

            <Container size="2">
              <Text as="p" size="3" weight="medium" align="center" wrap="pretty">
                {t("sections.visibility.summary")}
              </Text>
            </Container>
          </Flex>
        </Container>
      </Section>

      <Container size="4" px={{ initial: "4", sm: "6" }}>
        <Separator size="4" />
      </Container>

      <Section size="3" aria-labelledby="how-it-works-architecture">
        <Container size="4" px={{ initial: "4", sm: "6" }}>
          <Flex direction="column" gap={{ initial: "5", md: "7" }}>
            <Container size="3">
              <Flex direction="column" gap="3">
                <Text size="2" weight="medium" color="iris">
                  {t("sections.architecture.eyebrow")}
                </Text>
                <Heading id="how-it-works-architecture" as="h2" size="7">
                  {t("sections.architecture.title")}
                </Heading>
                <Text as="p" size="3" color="gray" wrap="pretty">
                  {t("sections.architecture.body")}
                </Text>
                <Text as="p" size="3" color="gray" wrap="pretty">
                  {t("sections.architecture.flowBody")}
                </Text>
              </Flex>
            </Container>

            <Box asChild my="0" mx="auto" minWidth="0" width="100%" maxWidth="68rem">
              <figure>
                <Image
                  className={styles["figureImage"]}
                  src={systemArchitecture}
                  alt={t("figures.architectureAlt")}
                  sizes="(min-width: 1200px) 68rem, 100vw"
                />
              </figure>
            </Box>
          </Flex>
        </Container>
      </Section>

      <Section size="2" aria-labelledby="how-it-works-zero-knowledge">
        <Container size="2" px={{ initial: "4", sm: "6" }}>
          <Flex direction="column" gap="3">
            <Text size="2" weight="medium" color="iris">
              {t("sections.zeroKnowledge.eyebrow")}
            </Text>
            <Heading id="how-it-works-zero-knowledge" as="h2" size="6">
              {t("sections.zeroKnowledge.title")}
            </Heading>
            <Text as="p" size="3" color="gray" wrap="pretty">
              {t("sections.zeroKnowledge.body")}
            </Text>
            <Text as="p" size="3" color="gray" wrap="pretty">
              {t("sections.zeroKnowledge.limitsBody")}
            </Text>
          </Flex>
        </Container>
      </Section>

      <Section size="3" aria-labelledby="how-it-works-technical-depth">
        <Container size="2" px={{ initial: "4", sm: "6" }}>
          <Flex direction="column" align="center" gap="4">
            <Text size="2" weight="medium" color="iris">
              {t("sections.technicalDepth.eyebrow")}
            </Text>
            <Heading id="how-it-works-technical-depth" as="h2" size="6" align="center">
              {t("sections.technicalDepth.title")}
            </Heading>
            <Text as="p" size="3" color="gray" align="center" wrap="pretty">
              {t("sections.technicalDepth.body")}
            </Text>
            <Button asChild variant="surface">
              <a
                href="https://github.com/santiagoa58/blind-journal"
                target="_blank"
                rel="noreferrer"
              >
                {t("navigation.technicalDocumentation")}
              </a>
            </Button>
          </Flex>
        </Container>
      </Section>
    </main>
  );
}
