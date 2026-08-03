import { setRequestLocale } from "next-intl/server";
import { JournalWorkspace } from "@/components/journal-workspace";
import type { Locale } from "@/i18n/routing";

export default async function JournalPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <JournalWorkspace />;
}
