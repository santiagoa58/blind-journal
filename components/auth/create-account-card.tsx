"use client";

import { createAccount } from "@/api/auth/auth";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type { CreateAccountInput } from "@/api/auth/auth.type";
import { useAppToast } from "@/hooks/use-app-toast";
import { Link as NavigationLink, useRouter } from "@/i18n/navigation";
import {
  ExclamationTriangleIcon,
  LockClosedIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import {
  Button,
  Callout,
  Card,
  Flex,
  Grid,
  Heading,
  Separator,
  Text,
} from "@radix-ui/themes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { LabeledInput } from "./labeled-input";

export function CreateAccountCard() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const appToast = useAppToast();
  const createAccountMutation = useMutation({
    mutationKey: ["auth", "create-account"],
    mutationFn: createAccount,
    onError() {
      appToast.error(tCommon("errors.network"));
    },
    onSuccess(response) {
      if (!response.success) {
        return;
      }

      queryClient.setQueryData(["auth", "session"], response);
      appToast.success(t("success.accountCreated"));
      router.replace("/journal");
    },
  });

  let errorMessage: string | null = null;

  if (createAccountMutation.isError) {
    errorMessage = tCommon("errors.network");
  } else if (
    createAccountMutation.data &&
    !createAccountMutation.data.success
  ) {
    switch (createAccountMutation.data.error.code) {
      case AUTH_ERROR_CODES.usernameRequired:
        errorMessage = t("errors.usernameRequired");
        break;
      case AUTH_ERROR_CODES.usernameInvalid:
        errorMessage = t("errors.usernameInvalid");
        break;
      case AUTH_ERROR_CODES.usernameTaken:
        errorMessage = t("errors.usernameTaken");
        break;
      case AUTH_ERROR_CODES.passwordRequired:
        errorMessage = t("errors.passwordRequired");
        break;
      case AUTH_ERROR_CODES.passwordTooShort:
        errorMessage = t("errors.passwordTooShort");
        break;
      case AUTH_ERROR_CODES.passwordsMismatch:
        errorMessage = t("errors.passwordsMismatch");
        break;
      default:
        errorMessage = tCommon("errors.unexpected");
    }
  }

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

    const input: CreateAccountInput = { username, password, confirmPassword };
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
            minLength={3}
            maxLength={24}
            name="username"
            pattern="[a-zA-Z0-9_-]+"
            placeholder={t("createAccount.usernamePlaceholder")}
            required
          >
            <PersonIcon aria-hidden />
          </LabeledInput>
          <LabeledInput
            autoComplete="new-password"
            description={t("createAccount.passwordHint")}
            label={t("createAccount.passwordLabel")}
            minLength={8}
            maxLength={128}
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
            minLength={8}
            maxLength={128}
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
