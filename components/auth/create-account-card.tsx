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
  USERNAME_PATTERN_SOURCE,
} from "@/api/auth/auth.constants";
import type { ClientCreateAccountRequest } from "@/api/auth/auth.type";
import { useAppToast } from "@/hooks/use-app-toast";
import { useClientSessionActions } from "@/hooks/use-client-session";
import { Link as NavigationLink } from "@/i18n/navigation";
import { LabeledInput } from "./labeled-input";

export function CreateAccountCard() {
  const t = useTranslations("auth");
  const appToast = useAppToast();
  const { replaceSession } = useClientSessionActions();

  const createAccountMutation = useMutation({
    gcTime: 0,
    mutationFn: createAccount,
    onSuccess(user) {
      replaceSession(user);
      appToast.success(t("success.accountCreated"));
    },
  });

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createAccountMutation.isPending) {
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
    createAccountMutation.mutate(input, {
      onSettled() {
        // Credentials and the derived key must not remain in MutationCache after submission.
        createAccountMutation.reset();
      },
    });
  }

  return (
    <Card size="4" variant="classic">
      <Text as="p" size="2" weight="medium" color="iris">
        {t("createAccount.eyebrow")}
      </Text>
      <Heading as="h1" size="7" mt="2">
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
            maxLength={MAX_USERNAME_LENGTH}
            pattern={USERNAME_PATTERN_SOURCE}
            autoFocus
            required
            disabled={createAccountMutation.isPending}
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
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            required
            disabled={createAccountMutation.isPending}
          >
            <LockClosedIcon aria-hidden />
          </LabeledInput>
          <LabeledInput
            autoComplete="new-password"
            label={t("createAccount.confirmPasswordLabel")}
            name="confirmPassword"
            placeholder={t("createAccount.confirmPasswordPlaceholder")}
            type="password"
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            required
            disabled={createAccountMutation.isPending}
          >
            <LockClosedIcon aria-hidden />
          </LabeledInput>

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
        {createAccountMutation.isPending ? (
          <Button variant="ghost" size="2" disabled>
            {t("createAccount.signIn")}
          </Button>
        ) : (
          <Button asChild variant="ghost" size="2">
            <NavigationLink href="/" replace>
              {t("createAccount.signIn")}
            </NavigationLink>
          </Button>
        )}
      </Flex>
    </Card>
  );
}
