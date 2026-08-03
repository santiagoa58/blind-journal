"use client";

import { getLoginSalt, login } from "@/api/auth/auth";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type { LoginRequest, SaltRequest } from "@/api/auth/auth.type";
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
import { useState } from "react";
import { LabeledInput } from "./labeled-input";

type LoginSalt = {
  username: string;
  salt: string;
};

export function LoginCard() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const appToast = useAppToast();
  const [loginSalt, setLoginSalt] = useState<LoginSalt | null>(null);
  const saltMutation = useMutation({
    mutationKey: ["auth", "login", "salt"],
    mutationFn: getLoginSalt,
    onError() {
      appToast.error(tCommon("errors.network"));
    },
    onSuccess(response, request) {
      if (response.success) {
        setLoginSalt({
          username: request.username.trim(),
          salt: response.data.salt,
        });
      }
    },
  });
  const loginMutation = useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: login,
    onError() {
      appToast.error(tCommon("errors.network"));
    },
    onSuccess(response) {
      if (!response.success) {
        return;
      }

      queryClient.setQueryData(["auth", "session"], response);
      appToast.success(t("success.signedIn"));
      router.replace("/journal");
    },
  });

  let errorMessage: string | null = null;

  const response = loginMutation.data ?? saltMutation.data;

  if (loginMutation.isError || saltMutation.isError) {
    errorMessage = tCommon("errors.network");
  } else if (response && !response.success) {
    switch (response.error.code) {
      case AUTH_ERROR_CODES.usernameRequired:
        errorMessage = t("errors.usernameRequired");
        break;
      case AUTH_ERROR_CODES.passwordRequired:
        errorMessage = t("errors.passwordRequired");
        break;
      case AUTH_ERROR_CODES.invalidCredentials:
        errorMessage = t("errors.invalidCredentials");
        break;
      default:
        errorMessage = tCommon("errors.unexpected");
    }
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");

    if (typeof username !== "string") {
      return;
    }

    if (!loginSalt) {
      const input: SaltRequest = { username };
      saltMutation.mutate(input);
      return;
    }

    const password = formData.get("password");

    if (typeof password !== "string") {
      return;
    }

    const input: LoginRequest = {
      username: loginSalt.username,
      password,
      salt: loginSalt.salt,
    };
    loginMutation.mutate(input);
  }

  function handleChangeUsername() {
    setLoginSalt(null);
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
            readOnly={loginSalt !== null}
            required
          >
            <PersonIcon aria-hidden />
          </LabeledInput>

          {loginSalt ? (
            <>
              <Button
                type="button"
                variant="soft"
                onClick={handleChangeUsername}
              >
                {t("signIn.changeUsername")}
              </Button>
              <LabeledInput
                autoComplete="current-password"
                autoFocus
                label={t("signIn.passwordLabel")}
                name="password"
                placeholder={t("signIn.passwordPlaceholder")}
                type="password"
                required
              >
                <LockClosedIcon aria-hidden />
              </LabeledInput>
            </>
          ) : null}

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
            loading={isPending}
            disabled={isPending}
          >
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
          <NavigationLink href="/sign-up">
            {t("signIn.createAccount")}
          </NavigationLink>
        </Button>
      </Flex>
    </Card>
  );
}
