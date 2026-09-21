"use client";

import { PersonIcon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Grid, Heading, Separator, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useAppToast } from "@/hooks/use-app-toast";
import { useStartJournalSession } from "@/hooks/use-start-journal-session";
import { Link as NavigationLink } from "@/i18n/navigation";
import { createAccount } from "@/lib/api/auth/auth";
import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN_SOURCE,
} from "@/lib/api/auth/auth.constants";
import type { ClientCreateAccountRequest } from "@/lib/api/auth/auth.type";
import {
  AUTH_FORM_ERROR_ID,
  AuthFormError,
  type AuthFormFailure,
  focusAuthFormFailure,
  useAuthFormFailure,
} from "./auth-form-error";
import { LabeledInput } from "./labeled-input";
import { PasswordInput } from "./password-input";

export function CreateAccountCard() {
  const t = useTranslations("auth");
  const appToast = useAppToast();
  const startJournalSession = useStartJournalSession();
  const formRef = useRef<HTMLFormElement>(null);
  const [formFailure, setFormFailure] = useState<AuthFormFailure | null>(null);
  const resolveFailure = useAuthFormFailure("create-account");

  const createAccountMutation = useMutation({
    gcTime: 0,
    meta: { inlineError: true },
    mutationFn: createAccount,
    onSuccess(user) {
      startJournalSession(user);
      appToast.success(t("success.accountCreated"));
    },
  });

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createAccountMutation.isPending) {
      return;
    }
    setFormFailure(null);

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
      onSettled(_data, error) {
        // Credentials and the derived key must not remain in MutationCache after submission.
        createAccountMutation.reset();
        if (error) {
          const failure = resolveFailure(error);
          setFormFailure(failure);
          focusAuthFormFailure(formRef.current, failure);
        }
      },
    });
  }

  return (
    <Card size="4" variant="surface">
      <Text as="p" size="2" weight="medium" color="iris">
        {t("createAccount.eyebrow")}
      </Text>
      <Heading as="h1" size="7" mt="2">
        {t("createAccount.title")}
      </Heading>
      <Text as="p" color="gray" size="2" mt="2">
        {t("createAccount.description")}
      </Text>

      <form ref={formRef} onSubmit={handleSubmit}>
        <Grid gap="4" mt="6">
          <AuthFormError failure={formFailure} />
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
            aria-invalid={formFailure?.fields.includes("username") || undefined}
            aria-errormessage={
              formFailure?.fields.includes("username") ? AUTH_FORM_ERROR_ID : undefined
            }
            aria-describedby={
              formFailure?.fields.includes("username") ? AUTH_FORM_ERROR_ID : undefined
            }
          >
            <PersonIcon aria-hidden />
          </LabeledInput>
          <PasswordInput
            autoComplete="new-password"
            description={t("passwordRequirements", {
              maxLength: MAX_PASSWORD_LENGTH,
              minLength: MIN_PASSWORD_LENGTH,
            })}
            label={t("createAccount.passwordLabel")}
            name="password"
            placeholder={t("createAccount.passwordPlaceholder")}
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            required
            disabled={createAccountMutation.isPending}
            aria-invalid={formFailure?.fields.includes("password") || undefined}
            aria-errormessage={
              formFailure?.fields.includes("password") ? AUTH_FORM_ERROR_ID : undefined
            }
            aria-describedby={
              formFailure?.fields.includes("password") ? AUTH_FORM_ERROR_ID : undefined
            }
            showPasswordLabel={t("showPassword")}
            hidePasswordLabel={t("hidePassword")}
          />
          <PasswordInput
            autoComplete="new-password"
            label={t("createAccount.confirmPasswordLabel")}
            name="confirmPassword"
            placeholder={t("createAccount.confirmPasswordPlaceholder")}
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            required
            disabled={createAccountMutation.isPending}
            aria-invalid={formFailure?.fields.includes("confirmPassword") || undefined}
            aria-errormessage={
              formFailure?.fields.includes("confirmPassword") ? AUTH_FORM_ERROR_ID : undefined
            }
            aria-describedby={
              formFailure?.fields.includes("confirmPassword") ? AUTH_FORM_ERROR_ID : undefined
            }
            showPasswordLabel={t("showConfirmPassword")}
            hidePasswordLabel={t("hideConfirmPassword")}
          />

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
