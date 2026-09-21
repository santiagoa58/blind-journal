"use client";

import {
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Separator,
  Text,
  VisuallyHidden,
} from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useAppSession } from "@/client-state/app-session.state";
import { useAppToast } from "@/hooks/use-app-toast";
import { useLogout } from "@/hooks/use-logout";
import { login } from "@/lib/api/auth/auth";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/api/auth/auth.constants";
import type { ApiUser } from "@/lib/api/auth/user.type";
import {
  AUTH_FORM_ERROR_ID,
  AuthFormError,
  type AuthFormFailure,
  focusAuthFormFailure,
  useAuthFormFailure,
} from "./auth-form-error";
import { PasswordInput } from "./password-input";

export function UnlockCard({ user }: { user: ApiUser }) {
  const t = useTranslations("auth");
  const appToast = useAppToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [formFailure, setFormFailure] = useState<AuthFormFailure | null>(null);
  const resolveFailure = useAuthFormFailure("unlock");
  const unlock = useAppSession((state) => state.unlock);
  const { signOut } = useLogout();
  const unlockMutation = useMutation({
    gcTime: 0,
    meta: { inlineError: true },
    mutationFn: (password: string) => login({ username: user.username, password }),
    onSuccess(unlockedUser) {
      unlock(unlockedUser);
      appToast.success(t("success.unlocked"));
    },
  });
  const submitting = unlockMutation.isPending;

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }
    setFormFailure(null);

    const password = new FormData(event.currentTarget).get("password");
    if (typeof password !== "string") {
      return;
    }

    unlockMutation.mutate(password, {
      onSettled(_data, error) {
        // The passphrase and derived key must not remain in MutationCache after submission.
        unlockMutation.reset();
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
        {t("unlock.eyebrow")}
      </Text>
      <Heading as="h1" size="7" mt="2">
        {t("unlock.title")}
      </Heading>
      <Text as="p" color="gray" size="2" mt="2">
        {t("unlock.description", { username: user.displayName })}
      </Text>

      <form ref={formRef} onSubmit={handleSubmit}>
        <Grid gap="4" mt="6">
          <VisuallyHidden asChild>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={user.username}
              readOnly
              tabIndex={-1}
              aria-label={t("unlock.usernameLabel")}
            />
          </VisuallyHidden>
          <AuthFormError failure={formFailure} />
          <PasswordInput
            autoComplete="current-password"
            label={t("unlock.passwordLabel")}
            name="password"
            placeholder={t("unlock.passwordPlaceholder")}
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            required
            autoFocus
            disabled={submitting}
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
          <Button type="submit" size="3" loading={unlockMutation.isPending} disabled={submitting}>
            {t("unlock.submit")}
          </Button>
        </Grid>
      </form>

      <Separator size="4" my="5" />
      <Flex align="center" justify="center">
        <Button type="button" variant="ghost" size="2" disabled={submitting} onClick={signOut}>
          {t("unlock.signOut")}
        </Button>
      </Flex>
    </Card>
  );
}
