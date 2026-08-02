"use client";

import { LockClosedIcon, PersonIcon } from "@radix-ui/react-icons";
import { Button, Card, type CardProps, Flex, Heading, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { fetchUserSalt } from "@/api/auth/auth";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type { UserSaltRequest, UserSaltResponse } from "@/api/auth/auth.type";
import { LabeledInput } from "@/components/labeled-input";
import { Link } from "@/i18n/navigation";

export function LoginCard(props: CardProps) {
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const userSaltMutation = useMutation<UserSaltResponse, Error, UserSaltRequest>({
    mutationKey: ["auth", "user-salt"],
    mutationFn: fetchUserSalt,
  });
  const response = userSaltMutation.data;
  let errorMessage: string | null = null;

  if (userSaltMutation.isError) {
    errorMessage = tCommon("errors.network");
  } else if (response && !response.success) {
    switch (response.error.code) {
      case AUTH_ERROR_CODES.usernameRequired:
        errorMessage = tAuth("errors.usernameRequired");
        break;
      case AUTH_ERROR_CODES.userNotFound:
        errorMessage = tAuth("errors.userNotFound");
        break;
      default:
        errorMessage = tCommon("errors.unexpected");
    }
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");

    if (typeof username === "string") {
      userSaltMutation.mutate({ username });
    }
  }

  return (
    <Card {...props}>
      <Heading>{tAuth("signIn.title")}</Heading>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3" mt="5" mb="5" justify="center">
          <LabeledInput
            label={tAuth("signIn.usernameLabel")}
            name="username"
            placeholder={tAuth("signIn.usernamePlaceholder")}
            required
          >
            <PersonIcon />
          </LabeledInput>
          <LabeledInput
            label={tAuth("signIn.passwordLabel")}
            name="password"
            placeholder={tAuth("signIn.passwordPlaceholder")}
            type="password"
            required
          >
            <LockClosedIcon />
          </LabeledInput>
        </Flex>
        <Flex gap="2" mb="3">
          <Button asChild variant="soft">
            <Link href="/sign-up">{tAuth("signIn.createAccount")}</Link>
          </Button>
          <Button
            type="submit"
            loading={userSaltMutation.isPending}
            disabled={userSaltMutation.isPending}
          >
            {tAuth("signIn.submit")}
          </Button>
        </Flex>
        {errorMessage ? (
          <Text as="p" color="red" role="alert" size="2">
            {errorMessage}
          </Text>
        ) : null}
        {response?.success ? (
          <Text as="p" color="green" role="status" size="2">
            {tAuth("success.accountInformationReceived")}
          </Text>
        ) : null}
      </form>
    </Card>
  );
}
