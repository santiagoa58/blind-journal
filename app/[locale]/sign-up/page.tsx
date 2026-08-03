import { setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { CreateAccountCard } from "@/components/auth/create-account-card";
import type { Locale } from "@/i18n/routing";

export default async function SignUpPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <AuthShell>
        <CreateAccountCard />
      </AuthShell>
    </main>
  );
}
