import { cookies } from "next/headers";
import { JournalWorkspace } from "@/components/journal/journal-workspace";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSessionUserIdFromSessionId, SESSION_COOKIE_NAME } from "@/server/session";

export default async function JournalPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const [{ locale }, cookieStore] = await Promise.all([params, cookies()]);
  const userId = getSessionUserIdFromSessionId(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!userId) {
    redirect({ href: "/", locale });
  }

  // TODO(auth-unlock): A valid session does not restore the client-only vault key after refresh.
  // Render an explicit locked/unlock flow before mounting JournalWorkspace when no key is in memory.
  return <JournalWorkspace />;
}
