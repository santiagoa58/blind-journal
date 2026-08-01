import { LoginCard } from "@/components/auth/login-card";
import { Box } from "@radix-ui/themes";

export default function Home() {
  return (
    <Box maxWidth="400px" mx="auto" mt="10">
      <LoginCard />
    </Box>
  );
}
