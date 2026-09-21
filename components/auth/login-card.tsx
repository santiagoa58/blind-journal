"use client";

import { PersonIcon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Grid, Heading, Separator, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useAppToast } from "@/hooks/use-app-toast";
import { useStartJournalSession } from "@/hooks/use-start-journal-session";
import { Link as NavigationLink } from "@/i18n/navigation";
import { login } from "@/lib/api/auth/auth";
import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN_SOURCE,
} from "@/lib/api/auth/auth.constants";
import type { ClientLoginRequest } from "@/lib/api/auth/auth.type";
import {
  AUTH_FORM_ERROR_ID,
  AuthFormError,
  type AuthFormFailure,
  focusAuthFormFailure,
  useAuthFormFailure,
} from "./auth-form-error";
import { LabeledInput } from "./labeled-input";
import { PasswordInput } from "./password-input";

export function LoginCard() {
  const t = useTranslations("auth");
  const appToast = useAppToast();
  const startJournalSession = useStartJournalSession();
  const formRef = useRef<HTMLFormElement>(null);
  const [formFailure, setFormFailure] = useState<AuthFormFailure | null>(null);
  const resolveFailure = useAuthFormFailure("sign-in");
  const loginMutation = useMutation({
    gcTime: 0,
    meta: { inlineError: true },
    mutationFn: login,
    onSuccess(user) {
      startJournalSession(user);
      appToast.success(t("success.signedIn"));
    },
  });

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loginMutation.isPending) {
      return;
    }
    setFormFailure(null);

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");

    if (typeof username !== "string") {
      return;
    }

    const password = formData.get("password");

    if (typeof password !== "string") {
      return;
    }

    const input: ClientLoginRequest = { username, password };
    loginMutation.mutate(input, {
      onSettled(_data, error) {
        // Credentials and the derived key must not remain in MutationCache after submission.
        loginMutation.reset();
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
        {t("signIn.eyebrow")}
      </Text>
      <Heading as="h1" size="7" mt="2">
        {t("signIn.title")}
      </Heading>
      <Text as="p" color="gray" size="2" mt="2">
        {t("signIn.description")}
      </Text>

      <form ref={formRef} onSubmit={handleSubmit}>
        <Grid gap="4" mt="6">
          <AuthFormError failure={formFailure} />
          <LabeledInput
            autoComplete="username"
            label={t("signIn.usernameLabel")}
            name="username"
            placeholder={t("signIn.usernamePlaceholder")}
            defaultValue={loginMutation.variables?.username ?? ""}
            maxLength={MAX_USERNAME_LENGTH}
            pattern={USERNAME_PATTERN_SOURCE}
            autoFocus
            required
            disabled={loginMutation.isPending}
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
            autoComplete="current-password"
            label={t("signIn.passwordLabel")}
            name="password"
            placeholder={t("signIn.passwordPlaceholder")}
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            required
            disabled={loginMutation.isPending}
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
          <Button
            type="submit"
            size="3"
            loading={loginMutation.isPending}
            disabled={loginMutation.isPending}
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
        {loginMutation.isPending ? (
          <Button variant="ghost" size="2" disabled>
            {t("signIn.createAccount")}
          </Button>
        ) : (
          <Button asChild variant="ghost" size="2">
            <NavigationLink href="/sign-up" replace>
              {t("signIn.createAccount")}
            </NavigationLink>
          </Button>
        )}
      </Flex>
    </Card>
  );
}
