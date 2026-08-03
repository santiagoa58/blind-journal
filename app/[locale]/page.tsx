import { setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginCard } from "@/components/auth/login-card";
import type { Locale } from "@/i18n/routing";

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <AuthShell>
        <LoginCard />
      </AuthShell>
    </main>
  );
}
