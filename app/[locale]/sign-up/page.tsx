import { setRequestLocale } from "next-intl/server";
import { AuthRouteGuard } from "@/components/auth/auth-route-guard";
import { AuthShell } from "@/components/auth/auth-shell";
import { CreateAccountCard } from "@/components/auth/create-account-card";
import type { Locale } from "@/i18n/routing";

export default async function SignUpPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthRouteGuard>
      <main>
        <AuthShell>
          <CreateAccountCard />
        </AuthShell>
      </main>
    </AuthRouteGuard>
  );
}
