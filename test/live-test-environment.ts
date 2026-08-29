import { randomBytes } from "node:crypto";

export const TEST_AUTH_SALT_SECRET = randomBytes(32).toString("base64url");

export function requireDatabaseTestUrl(): string {
  // biome-ignore lint/style/noProcessEnv: test configuration validates external input.
  const value = process.env["DATABASE_TEST_URL"];
  if (!value) {
    throw new Error("DATABASE_TEST_URL is required for tests that write to the database.");
  }

  let databaseUrl: URL;
  try {
    databaseUrl = new URL(value);
  } catch {
    throw new Error("DATABASE_TEST_URL must be a valid PostgreSQL connection URL.");
  }

  if (databaseUrl.protocol !== "postgres:" && databaseUrl.protocol !== "postgresql:") {
    throw new Error("DATABASE_TEST_URL must be a valid PostgreSQL connection URL.");
  }

  return value;
}
