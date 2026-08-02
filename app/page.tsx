import { Box } from "@radix-ui/themes";
import { LoginCard } from "@/features/auth/login-card";

export default function Home() {
  return (
    <Box maxWidth="400px" mx="auto" mt="10">
      <LoginCard />
    </Box>
  );
}
