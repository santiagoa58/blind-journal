import { AuthShell } from "@/features/auth/auth-shell";
import { CreateAccountCard } from "@/features/auth/create-account-card";
import type { Locale } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
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
