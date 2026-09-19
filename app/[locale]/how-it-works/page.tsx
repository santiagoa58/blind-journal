import type { Metadata } from "next";
import { LockClosedIcon } from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Callout,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Section,
  Separator,
  Text,
} from "@radix-ui/themes";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BrandMark } from "@/components/brand-mark";
import { EducationalFigurePlaceholder } from "@/components/how-it-works/educational-figure-placeholder";
import { LanguageSelector } from "@/components/language-selector";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

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

function HeaderBrand() {
  return (
    <BrandMark.Root>
      <BrandMark.Avatar />
      <Box asChild display={{ initial: "none", sm: "inline" }}>
        <BrandMark.Name />
      </Box>
    </BrandMark.Root>
  );
}

export default async function HowItWorksPage({ params }: HowItWorksPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("how-it-works");

  return (
    <>
      <Box asChild py="3">
        <header>
          <Container size="4" px={{ initial: "4", sm: "6" }}>
            <Flex align="center" justify="between" gap="3">
              <Button asChild size="2" variant="ghost" color="gray">
                <Link href="/" aria-label={t("navigation.homeLabel")}>
                  <HeaderBrand />
                </Link>
              </Button>

              <Flex asChild align="center" gap="2" flexShrink="0">
                <nav aria-label={t("navigation.pageNavigationLabel")}>
                  <Button asChild size="2">
                    <Link href="/journal">{t("navigation.openJournal")}</Link>
                  </Button>
                  <LanguageSelector compact />
                </nav>
              </Flex>
            </Flex>
          </Container>
        </header>
      </Box>
      <Separator size="4" />

      <main>
        <Section size="3">
          <Container size="2" px={{ initial: "4", sm: "6" }}>
            <Flex direction="column" align="center" gap="4">
              <Text size="2" weight="medium" color="iris">
                {t("hero.eyebrow")}
              </Text>
              <Heading as="h1" size={{ initial: "8", sm: "9" }} align="center">
                {t("hero.title")}
              </Heading>
              <Text as="p" size="4" color="gray" align="center" wrap="pretty">
                {t("structure.contentPlaceholder")}
              </Text>
            </Flex>
          </Container>
        </Section>

        <Section size="3" aria-labelledby="how-it-works-big-picture">
          <Container size="4" px={{ initial: "4", sm: "6" }}>
            <Grid columns={{ initial: "1", md: "2" }} gap={{ initial: "6", md: "8" }} align="center">
              <Flex direction="column" gap="3">
                <Text size="2" weight="medium" color="iris">
                  {t("sections.bigPicture.eyebrow")}
                </Text>
                <Heading id="how-it-works-big-picture" as="h2" size="7">
                  {t("sections.bigPicture.title")}
                </Heading>
                <Text as="p" color="gray" wrap="pretty">
                  {t("structure.contentPlaceholder")}
                </Text>
              </Flex>
              <EducationalFigurePlaceholder
                placeholderLabel={t("structure.figurePlaceholder")}
                caption={t("figures.bigPicture")}
              />
            </Grid>
          </Container>
        </Section>

        <Section size="3" aria-labelledby="how-it-works-authentication">
          <Container size="4" px={{ initial: "4", sm: "6" }}>
            <Flex
              direction={{ initial: "column", md: "row-reverse" }}
              gap={{ initial: "6", md: "8" }}
              align="center"
            >
              <Box width={{ initial: "100%", md: "50%" }}>
                <Flex direction="column" gap="3">
                  <Text size="2" weight="medium" color="iris">
                    {t("sections.authentication.eyebrow")}
                  </Text>
                  <Heading id="how-it-works-authentication" as="h2" size="7">
                    {t("sections.authentication.title")}
                  </Heading>
                  <Text as="p" color="gray" wrap="pretty">
                    {t("structure.contentPlaceholder")}
                  </Text>
                </Flex>
              </Box>
              <Box width={{ initial: "100%", md: "50%" }}>
                <EducationalFigurePlaceholder
                  placeholderLabel={t("structure.figurePlaceholder")}
                  caption={t("figures.authentication")}
                />
              </Box>
            </Flex>
          </Container>
        </Section>

        <Section size="3" aria-labelledby="how-it-works-saving">
          <Container size="4" px={{ initial: "4", sm: "6" }}>
            <Flex direction="column" gap={{ initial: "5", md: "7" }}>
              <Container size="2">
                <Flex direction="column" align="center" gap="3">
                  <Text size="2" weight="medium" color="iris">
                    {t("sections.saving.eyebrow")}
                  </Text>
                  <Heading id="how-it-works-saving" as="h2" size="7" align="center">
                    {t("sections.saving.title")}
                  </Heading>
                  <Text as="p" color="gray" align="center" wrap="pretty">
                    {t("structure.contentPlaceholder")}
                  </Text>
                </Flex>
              </Container>
              <EducationalFigurePlaceholder
                placeholderLabel={t("structure.figurePlaceholder")}
                caption={t("figures.saving")}
              />
            </Flex>
          </Container>
        </Section>

        <Section size="3" aria-labelledby="how-it-works-visibility">
          <Container size="4" px={{ initial: "4", sm: "6" }}>
            <Flex direction="column" gap="5">
              <Container size="2">
                <Flex direction="column" align="center" gap="3">
                  <Text size="2" weight="medium" color="iris">
                    {t("sections.visibility.eyebrow")}
                  </Text>
                  <Heading id="how-it-works-visibility" as="h2" size="7" align="center">
                    {t("sections.visibility.title")}
                  </Heading>
                </Flex>
              </Container>
              <Grid columns={{ initial: "1", md: "2" }} gap="4">
                <Card size="4" variant="surface">
                  <Flex direction="column" gap="3">
                    <Heading as="h3" size="5">
                      {t("sections.visibility.observableTitle")}
                    </Heading>
                    <Text as="p" color="gray">
                      {t("structure.listPlaceholder")}
                    </Text>
                  </Flex>
                </Card>
                <Card size="4" variant="surface">
                  <Flex direction="column" gap="3">
                    <Heading as="h3" size="5">
                      {t("sections.visibility.privateTitle")}
                    </Heading>
                    <Text as="p" color="gray">
                      {t("structure.listPlaceholder")}
                    </Text>
                  </Flex>
                </Card>
              </Grid>
            </Flex>
          </Container>
        </Section>

        <Section size="3" aria-labelledby="how-it-works-zero-knowledge">
          <Container size="2" px={{ initial: "4", sm: "6" }}>
            <Flex direction="column" gap="4">
              <Text size="2" weight="medium" color="iris">
                {t("sections.zeroKnowledge.eyebrow")}
              </Text>
              <Heading id="how-it-works-zero-knowledge" as="h2" size="7">
                {t("sections.zeroKnowledge.title")}
              </Heading>
              <Text as="p" color="gray" wrap="pretty">
                {t("structure.contentPlaceholder")}
              </Text>
              <Callout.Root color="iris" variant="surface">
                <Callout.Icon>
                  <LockClosedIcon aria-hidden />
                </Callout.Icon>
                <Callout.Text>{t("structure.calloutPlaceholder")}</Callout.Text>
              </Callout.Root>
            </Flex>
          </Container>
        </Section>

        <Section size="3" aria-labelledby="how-it-works-architecture">
          <Container size="4" px={{ initial: "4", sm: "6" }}>
            <Flex direction="column" gap={{ initial: "5", md: "7" }}>
              <Container size="2">
                <Flex direction="column" align="center" gap="3">
                  <Text size="2" weight="medium" color="iris">
                    {t("sections.architecture.eyebrow")}
                  </Text>
                  <Heading id="how-it-works-architecture" as="h2" size="7" align="center">
                    {t("sections.architecture.title")}
                  </Heading>
                  <Text as="p" color="gray" align="center" wrap="pretty">
                    {t("structure.contentPlaceholder")}
                  </Text>
                </Flex>
              </Container>
              <EducationalFigurePlaceholder
                placeholderLabel={t("structure.figurePlaceholder")}
                caption={t("figures.architecture")}
              />
            </Flex>
          </Container>
        </Section>

        <Section size="2" aria-labelledby="how-it-works-technical-depth">
          <Container size="2" px={{ initial: "4", sm: "6" }}>
            <Flex direction="column" gap="3">
              <Text size="2" weight="medium" color="iris">
                {t("sections.technicalDepth.eyebrow")}
              </Text>
              <Heading id="how-it-works-technical-depth" as="h2" size="6">
                {t("sections.technicalDepth.title")}
              </Heading>
              <Text as="p" color="gray" wrap="pretty">
                {t("structure.contentPlaceholder")}
              </Text>
            </Flex>
          </Container>
        </Section>

        <Section size="3" aria-labelledby="how-it-works-closing">
          <Container size="2" px={{ initial: "4", sm: "6" }}>
            <Card size="4" variant="surface">
              <Flex direction="column" align="center" gap="4">
                <Heading id="how-it-works-closing" as="h2" size="6" align="center">
                  {t("sections.closing.title")}
                </Heading>
                <Text as="p" color="gray" align="center" wrap="pretty">
                  {t("structure.contentPlaceholder")}
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
            </Card>
          </Container>
        </Section>
      </main>
    </>
  );
}
