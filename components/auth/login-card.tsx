"use client";

import { LabeledInput } from "@/components/labeled-input";
import { apiFetch } from "@/lib/api/client";
import { LockClosedIcon, PersonIcon } from "@radix-ui/react-icons";
import {
  Button,
  Card,
  type CardProps,
  Flex,
  Heading,
  Link,
} from "@radix-ui/themes";

async function fetchUserSalt(username: string) {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({ username }),
  });

  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw new Error(
      `Expected a JSON response, but received ${contentType ?? "no content type"}.`,
    );
  }

  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return payload;
}
async function handleSubmit(username: string, _password: string) {
  const userSalt = await fetchUserSalt(username);
  console.log("User salt:", userSalt);
}

export function LoginCard(props: CardProps) {
  return (
    <Card {...props}>
      <Heading>Sign in</Heading>
      <form
        action={async function signIn(formData) {
          const username = formData.get("username");
          const password = formData.get("password");
          if (username && password) {
            await handleSubmit(username.toString(), password.toString());
          }
        }}
      >
        <Flex direction="column" gap="3" mt="5" mb="5" justify="center">
          <LabeledInput
            label="Username"
            name="username"
            placeholder="Enter your username"
            required
          >
            <PersonIcon />
          </LabeledInput>
          <LabeledInput
            label="Password"
            name="password"
            placeholder="Enter your password"
            type="password"
            required
          >
            <LockClosedIcon />
          </LabeledInput>
        </Flex>
        <Flex gap="2">
          <Button asChild variant="soft">
            <Link href="/sign-up" underline="none">
              Create account
            </Link>
          </Button>
          <Button>Sign in</Button>
        </Flex>
      </form>
    </Card>
  );
}
