import { Flex } from "@radix-ui/themes";
import { setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginCard } from "@/components/auth/login-card";
import { SignedOutRoute } from "@/components/auth/signed-out-route";
import type { Locale } from "@/i18n/routing";

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <SignedOutRoute>
      <Flex asChild direction="column" flexGrow="1">
        <main>
          <AuthShell>
            <LoginCard />
          </AuthShell>
        </main>
      </Flex>
    </SignedOutRoute>
  );
}
