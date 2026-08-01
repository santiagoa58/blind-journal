import { LabeledInput } from "@/components/labeled-input";
import { LockClosedIcon, PersonIcon } from "@radix-ui/react-icons";
import { Button, Card, type CardProps, Flex, Heading } from "@radix-ui/themes";

export function LoginCard(props: CardProps) {
  return (
    <Card {...props}>
      <Heading>Sign in</Heading>
      <form>
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
        <Button>Sign in</Button>
      </form>
    </Card>
  );
}
