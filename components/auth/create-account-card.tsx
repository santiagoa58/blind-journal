"use client";

import { ExclamationTriangleIcon, LockClosedIcon, PersonIcon } from "@radix-ui/react-icons";
import { Button, Callout, Card, Flex, Grid, Heading, Separator, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { createAccount, getCreateAccountSalt } from "@/api/auth/auth";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type { ClientCreateAccountRequest } from "@/api/auth/auth.type";
import { useAppToast } from "@/hooks/use-app-toast";
import { Link as NavigationLink, useRouter } from "@/i18n/navigation";
import { useUser } from "@/state/user.state";
import { LabeledInput } from "./labeled-input";

type CreateAccountCredentials = Omit<ClientCreateAccountRequest, "salt">;

async function submitCreateAccount(input: CreateAccountCredentials) {
  const saltResponse = await getCreateAccountSalt({ username: input.username });

  if (!saltResponse.success) {
    return saltResponse;
  }

  return createAccount({
    ...input,
    salt: saltResponse.data.salt,
  });
}

export function CreateAccountCard() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const setUser = useUser((state) => state.setUser);
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const appToast = useAppToast();
  const createAccountMutation = useMutation({
    mutationKey: ["auth", "create-account"],
    mutationFn: submitCreateAccount,
    onError() {
      appToast.error(tCommon("errors.network"));
      setErrorMessage(tCommon("errors.network"));
    },
    onSuccess(response) {
      if (!response.success) {
        const errCode = response.error.code;
        switch (errCode) {
          case AUTH_ERROR_CODES.usernameRequired:
            setErrorMessage(t("errors.usernameRequired"));
            return;
          case AUTH_ERROR_CODES.usernameInvalid:
            setErrorMessage(t("errors.usernameInvalid"));
            return;
          case AUTH_ERROR_CODES.usernameTaken:
            setErrorMessage(t("errors.usernameTaken"));
            return;
          case AUTH_ERROR_CODES.passwordRequired:
            setErrorMessage(t("errors.passwordRequired"));
            return;
          case AUTH_ERROR_CODES.passwordTooShort:
            setErrorMessage(t("errors.passwordTooShort"));
            return;
          case AUTH_ERROR_CODES.passwordsMismatch:
            setErrorMessage(t("errors.passwordsMismatch"));
            return;
          default:
            setErrorMessage(tCommon("errors.unexpected"));
            return;
        }
      }
      setErrorMessage(null);
      setUser({ ...response.data.user, keyEncryptionKey: response.data.keyEncryptionKey });
      appToast.success(t("success.accountCreated"));
      router.replace("/journal");
    },
  });

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
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
    if (password !== confirmPassword) {
      setErrorMessage(t("errors.passwordsMismatch"));
      return;
    }

    const input: CreateAccountCredentials = { username, password };
    createAccountMutation.mutate(input);
  }

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
            description={t("createAccount.usernameHint")}
            label={t("createAccount.usernameLabel")}
            name="username"
            placeholder={t("createAccount.usernamePlaceholder")}
            required
          >
            <PersonIcon aria-hidden />
          </LabeledInput>
          <LabeledInput
            autoComplete="new-password"
            description={t("createAccount.passwordHint")}
            label={t("createAccount.passwordLabel")}
            name="password"
            placeholder={t("createAccount.passwordPlaceholder")}
            type="password"
            required
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
          >
            <LockClosedIcon aria-hidden />
          </LabeledInput>

          {errorMessage ? (
            <Callout.Root color="red" role="alert" size="1">
              <Callout.Icon>
                <ExclamationTriangleIcon />
              </Callout.Icon>
              <Callout.Text>{errorMessage}</Callout.Text>
            </Callout.Root>
          ) : null}

          <Button
            type="submit"
            size="3"
            loading={createAccountMutation.isPending}
            disabled={createAccountMutation.isPending}
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
