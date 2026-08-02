import { Box } from "@radix-ui/themes";
import { setRequestLocale } from "next-intl/server";
import { LoginCard } from "@/features/auth/login-card";
import type { Locale } from "@/i18n/routing";

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Box maxWidth="400px" mx="auto" mt="10">
      <LoginCard />
    </Box>
  );
}
