"use client";

import { LockClosedIcon, PersonIcon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Grid, Heading, Separator, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { createAccount } from "@/api/auth/auth";
import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/api/auth/auth.constants";
import type { ClientCreateAccountRequest } from "@/api/auth/auth.type";
import { useLogoutUnresolved } from "@/hooks/logout-mutation";
import { useAppToast } from "@/hooks/use-app-toast";
import { Link as NavigationLink, useRouter } from "@/i18n/navigation";
import { useUser } from "@/state/user.state";
import { LabeledInput } from "./labeled-input";

export function CreateAccountCard() {
  const setUser = useUser((state) => state.setUser);
  const t = useTranslations("auth");
  const router = useRouter();
  const appToast = useAppToast();
  const logoutUnresolved = useLogoutUnresolved();

  // TODO(review-high-auth-secret-retention): As in the login form, TanStack Mutation retains the
  // password/confirmation variables and the derived key-encryption CryptoKey result. Keep these
  // secrets out of MutationCache or guarantee immediate disposal and test that invariant.
  const createAccountMutation = useMutation({
    mutationFn: createAccount,
  });

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createAccountMutation.isPending || logoutUnresolved) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return;
    }
    const input: ClientCreateAccountRequest = { username, password, confirmPassword };
    try {
      const response = await createAccountMutation.mutateAsync(input);
      setUser({ ...response.user, keyEncryptionKey: response.keyEncryptionKey });
      appToast.success(t("success.accountCreated"));
      router.replace("/journal");
    } catch {
      // The shared MutationCache presents the localized error.
    }
  }

  const authenticationDisabled = createAccountMutation.isPending || logoutUnresolved;

  return (
    <Card size="4" variant="classic">
      <Text as="p" size="2" weight="medium" color="iris">
        {t("createAccount.eyebrow")}
      </Text>
      <Heading as="h2" size="7" mt="2">
        {t("createAccount.title")}
      </Heading>
      <Text as="p" color="gray" size="2" mt="2">
        {t("createAccount.description")}
      </Text>

      <form onSubmit={handleSubmit}>
        <Grid gap="4" mt="6">
          <LabeledInput
            autoComplete="username"
            description={t("usernameRequirements", { maxLength: MAX_USERNAME_LENGTH })}
            label={t("createAccount.usernameLabel")}
            name="username"
            placeholder={t("createAccount.usernamePlaceholder")}
            required
            disabled={authenticationDisabled}
          >
            <PersonIcon aria-hidden />
          </LabeledInput>
          <LabeledInput
            autoComplete="new-password"
            description={t("passwordRequirements", {
              maxLength: MAX_PASSWORD_LENGTH,
              minLength: MIN_PASSWORD_LENGTH,
            })}
            label={t("createAccount.passwordLabel")}
            name="password"
            placeholder={t("createAccount.passwordPlaceholder")}
            type="password"
            required
            disabled={authenticationDisabled}
          >
            <LockClosedIcon aria-hidden />
          </LabeledInput>
          <LabeledInput
            autoComplete="new-password"
            label={t("createAccount.confirmPasswordLabel")}
            name="confirmPassword"
            placeholder={t("createAccount.confirmPasswordPlaceholder")}
            type="password"
            required
            disabled={authenticationDisabled}
          >
            <LockClosedIcon aria-hidden />
          </LabeledInput>

          <Button
            type="submit"
            size="3"
            loading={createAccountMutation.isPending}
            disabled={authenticationDisabled}
          >
            {t("createAccount.submit")}
          </Button>
        </Grid>
      </form>

      <Separator size="4" my="5" />
      <Flex align="center" justify="center" gap="2" wrap="wrap">
        <Text size="2" color="gray">
          {t("createAccount.signInPrompt")}
        </Text>
        <Button asChild variant="ghost" size="2">
          <NavigationLink href="/">{t("createAccount.signIn")}</NavigationLink>
        </Button>
      </Flex>
    </Card>
  );
}
