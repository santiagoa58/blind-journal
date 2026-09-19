import { Flex } from "@radix-ui/themes";
import { setRequestLocale } from "next-intl/server";
import { JournalWorkspace } from "@/components/journal/journal-workspace";
import type { Locale } from "@/i18n/routing";
import { requireAuthenticatedRoute } from "@/server/auth/route-access";

export default async function JournalPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAuthenticatedRoute(locale);

  return (
    <Flex asChild direction="column" flexGrow="1" minHeight="0" overflow="hidden">
      <main>
        <JournalWorkspace />
      </main>
    </Flex>
  );
}
