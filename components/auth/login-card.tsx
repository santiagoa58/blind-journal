"use client";

import { LabeledInput } from "@/components/labeled-input";
import { API_BASE_URL } from "@/lib/constants/api.constants";
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
  return fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });
}
async function handleSubmit(username: string, _password: string) {
  const res = await fetchUserSalt(username);
  const userSalt = await res.json();
  console.log("User salt:", userSalt);
}

export function LoginCard(props: CardProps) {
  return (
    <Card {...props}>
      <Heading>Sign in</Heading>
      <form
        action={function search(formData) {
          const username = formData.get("username");
          const password = formData.get("password");
          if (username && password) {
            handleSubmit(username.toString(), password.toString());
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
