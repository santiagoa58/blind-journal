"use client";

import { LabeledInput } from "@/components/labeled-input";
import { useUserSalt } from "@/features/auth/use-user-salt";
import { getAuthErrorMessage, messages } from "@/messages";
import { LockClosedIcon, PersonIcon } from "@radix-ui/react-icons";
import {
  Button,
  Card,
  type CardProps,
  Flex,
  Heading,
  Link,
  Text,
} from "@radix-ui/themes";

export function LoginCard(props: CardProps) {
  const userSaltMutation = useUserSalt();
  const copy = messages.auth;
  const response = userSaltMutation.data;
  const errorMessage = userSaltMutation.isError
    ? messages.common.errors.network
    : response && !response.success
      ? getAuthErrorMessage(response.error.code)
      : null;

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
      <Heading>{copy.signIn.title}</Heading>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3" mt="5" mb="5" justify="center">
          <LabeledInput
            label={copy.signIn.usernameLabel}
            name="username"
            placeholder={copy.signIn.usernamePlaceholder}
            required
          >
            <PersonIcon />
          </LabeledInput>
          <LabeledInput
            label={copy.signIn.passwordLabel}
            name="password"
            placeholder={copy.signIn.passwordPlaceholder}
            type="password"
            required
          >
            <LockClosedIcon />
          </LabeledInput>
        </Flex>
        <Flex gap="2" mb="3">
          <Button asChild variant="soft">
            <Link href="/sign-up" underline="none">
              {copy.signIn.createAccount}
            </Link>
          </Button>
          <Button
            type="submit"
            loading={userSaltMutation.isPending}
            disabled={userSaltMutation.isPending}
          >
            {copy.signIn.submit}
          </Button>
        </Flex>
        {errorMessage ? (
          <Text as="p" color="red" role="alert" size="2">
            {errorMessage}
          </Text>
        ) : null}
        {response?.success ? (
          <Text as="p" color="green" role="status" size="2">
            {copy.success.accountInformationReceived}
          </Text>
        ) : null}
      </form>
    </Card>
  );
}
