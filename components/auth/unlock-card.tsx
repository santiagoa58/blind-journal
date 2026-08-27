"use client";

import { Button, Card, Flex, Grid, Heading, Separator, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { login } from "@/api/auth/auth";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/api/auth/auth.constants";
import type { ApiUser } from "@/api/auth/user.type";
import { useAppSession } from "@/client-state/app-session.state";
import { useAppToast } from "@/hooks/use-app-toast";
import { useLogout } from "@/hooks/use-logout";
import { PasswordInput } from "./password-input";

export function UnlockCard({ user }: { user: ApiUser }) {
  const t = useTranslations("auth");
  const appToast = useAppToast();
  const unlock = useAppSession((state) => state.unlock);
  const { signOut, isPending: signingOut } = useLogout();
  const unlockMutation = useMutation({
    gcTime: 0,
    mutationFn: (password: string) => login({ username: user.username, password }),
    onSuccess(unlockedUser) {
      unlock(unlockedUser);
      appToast.success(t("success.unlocked"));
    },
  });
  const submitting = unlockMutation.isPending || signingOut;

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const password = new FormData(event.currentTarget).get("password");
    if (typeof password !== "string") {
      return;
    }

    unlockMutation.mutate(password, {
      onSettled() {
        // The passphrase and derived key must not remain in MutationCache after submission.
        unlockMutation.reset();
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

      <form onSubmit={handleSubmit}>
        <Grid gap="4" mt="6">
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
