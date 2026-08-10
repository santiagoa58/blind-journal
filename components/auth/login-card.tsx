"use client";

import { LockClosedIcon, PersonIcon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Grid, Heading, Separator, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getLoginSalt, login } from "@/api/auth/auth";
import type { ApiSaltRequest, ClientLoginRequest } from "@/api/auth/auth.type";
import { useAppToast } from "@/hooks/use-app-toast";
import { Link as NavigationLink, useRouter } from "@/i18n/navigation";
import { useUser } from "@/state/user.state";
import { LabeledInput } from "./labeled-input";

export function LoginCard() {
  const setUser = useUser((state) => state.setUser);
  const t = useTranslations("auth");
  const router = useRouter();
  const appToast = useAppToast();
  const saltMutation = useMutation({
    mutationKey: ["auth", "login", "salt"],
    mutationFn: getLoginSalt,
  });
  const loginSalt = saltMutation.data
    ? {
        username: saltMutation.variables.username.trim(),
        saltBase64: saltMutation.data.salt,
      }
    : null;
  const loginMutation = useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: login,
  });

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");

    if (typeof username !== "string") {
      return;
    }

    if (!loginSalt) {
      const input: ApiSaltRequest = { username };
      try {
        await saltMutation.mutateAsync(input);
      } catch {
        // The shared MutationCache presents the localized error.
      }
      return;
    }

    const password = formData.get("password");

    if (typeof password !== "string") {
      return;
    }

    const input: ClientLoginRequest = {
      username: loginSalt.username,
      password,
      salt: loginSalt.saltBase64,
    };
    try {
      const response = await loginMutation.mutateAsync(input);
      setUser({ ...response.user, keyEncryptionKey: response.keyEncryptionKey });
      appToast.success(t("success.signedIn"));
      router.replace("/journal");
    } catch {
      // The shared MutationCache presents the localized error.
    }
  }

  function handleChangeUsername() {
    saltMutation.reset();
    loginMutation.reset();
  }

  const isPending = saltMutation.isPending || loginMutation.isPending;

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
            defaultValue={loginSalt?.username ?? ""}
            required
            onChange={handleChangeUsername}
            disabled={isPending}
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
            disabled={loginMutation.isPending}
          >
            <LockClosedIcon aria-hidden />
          </LabeledInput>
          <Button type="submit" size="3" loading={isPending} disabled={isPending}>
            {loginSalt ? t("signIn.submit") : t("signIn.continue")}
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
