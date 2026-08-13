"use client";

import { LockClosedIcon, PersonIcon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Grid, Heading, Separator, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { login } from "@/api/auth/auth";
import type { ClientLoginRequest } from "@/api/auth/auth.type";
import { useLogoutUnresolved } from "@/hooks/logout-mutation";
import { useAppToast } from "@/hooks/use-app-toast";
import { Link as NavigationLink, useRouter } from "@/i18n/navigation";
import { useUser } from "@/state/user.state";
import { LabeledInput } from "./labeled-input";

export function LoginCard() {
  const setUser = useUser((state) => state.setUser);
  const t = useTranslations("auth");
  const router = useRouter();
  const appToast = useAppToast();
  const logoutUnresolved = useLogoutUnresolved();
  // TODO(review-high-auth-secret-retention): This mutation stores the submitted password in
  // Mutation.state.variables and the derived key-encryption CryptoKey in Mutation.state.data. A
  // failed attempt remains while this form is mounted, and a successful attempt remains until
  // garbage collection. Use an authentication submission path that does not cache secret inputs or
  // outputs, or prove immediate disposal with a regression test.
  const loginMutation = useMutation({
    mutationFn: login,
  });

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loginMutation.isPending || logoutUnresolved) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");

    if (typeof username !== "string") {
      return;
    }

    const password = formData.get("password");

    if (typeof password !== "string") {
      return;
    }

    try {
      const input: ClientLoginRequest = {
        username,
        password,
      };
      const response = await loginMutation.mutateAsync(input);
      setUser({ ...response.user, keyEncryptionKey: response.keyEncryptionKey });
      appToast.success(t("success.signedIn"));
      router.replace("/journal");
    } catch {
      // The shared MutationCache presents the localized error.
    }
  }

  const authenticationDisabled = loginMutation.isPending || logoutUnresolved;

  return (
    <Card size="4" variant="classic">
      <Text as="p" size="2" weight="medium" color="iris">
        {t("signIn.eyebrow")}
      </Text>
      <Heading as="h2" size="7" mt="2">
        {t("signIn.title")}
      </Heading>
      <Text as="p" color="gray" size="2" mt="2">
        {t("signIn.description")}
      </Text>

      <form onSubmit={handleSubmit}>
        <Grid gap="4" mt="6">
          <LabeledInput
            autoComplete="username"
            label={t("signIn.usernameLabel")}
            name="username"
            placeholder={t("signIn.usernamePlaceholder")}
            defaultValue={loginMutation.variables?.username ?? ""}
            required
            disabled={authenticationDisabled}
          >
            <PersonIcon aria-hidden />
          </LabeledInput>
          <LabeledInput
            autoComplete="current-password"
            autoFocus
            label={t("signIn.passwordLabel")}
            name="password"
            placeholder={t("signIn.passwordPlaceholder")}
            type="password"
            required
            disabled={authenticationDisabled}
          >
            <LockClosedIcon aria-hidden />
          </LabeledInput>
          <Button
            type="submit"
            size="3"
            loading={loginMutation.isPending}
            disabled={authenticationDisabled}
          >
            {t("signIn.submit")}
          </Button>
        </Grid>
      </form>

      <Separator size="4" my="5" />
      <Flex align="center" justify="center" gap="2" wrap="wrap">
        <Text size="2" color="gray">
          {t("signIn.createAccountPrompt")}
        </Text>
        <Button asChild variant="ghost" size="2">
          <NavigationLink href="/sign-up">{t("signIn.createAccount")}</NavigationLink>
        </Button>
      </Flex>
    </Card>
  );
}
