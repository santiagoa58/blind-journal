const EXPECTED_DATABASE_TEST_HOST = "ep-royal-bonus-ax9czfqv-pooler.c-4.us-east-2.aws.neon.tech";

export function requireDatabaseTestUrl(): string {
  // biome-ignore lint/style/noProcessEnv: test configuration validates external input.
  const value = process.env["DATABASE_TEST_URL"];
  if (!value) {
    throw new Error("DATABASE_TEST_URL is required for tests that write to the database.");
  }

  let hostname: string;
  try {
    hostname = new URL(value).hostname;
  } catch {
    throw new Error("DATABASE_TEST_URL must be a valid URL.");
  }

  if (hostname !== EXPECTED_DATABASE_TEST_HOST) {
    throw new Error("DATABASE_TEST_URL must point to the configured Neon development branch.");
  }

  return value;
}
