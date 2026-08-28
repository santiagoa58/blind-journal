import { defineConfig } from "vitest/config";

function requireDatabaseTestUrl(): string {
  // biome-ignore lint/style/noProcessEnv: this config validates the test runner's external input.
  const value = process.env["DATABASE_TEST_URL"];
  if (!value) {
    throw new Error(
      "DATABASE_TEST_URL is required and must point to the disposable development/test branch.",
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_TEST_URL must be a valid PostgreSQL connection URL.");
  }

  if (!/^postgres(?:ql)?:$/.test(url.protocol)) {
    throw new Error("DATABASE_TEST_URL must use the PostgreSQL protocol.");
  }
  if (url.username !== "blind_journal_app") {
    throw new Error("DATABASE_TEST_URL must use the restricted blind_journal_app role.");
  }
  if (!url.hostname.includes("-pooler.")) {
    throw new Error("DATABASE_TEST_URL must use Neon's pooled connection endpoint.");
  }

  return value;
}

const databaseTestUrl = requireDatabaseTestUrl();

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    env: {
      DATABASE_URL: databaseTestUrl,
    },
    environment: "node",
    fileParallelism: false,
    include: ["server/database/database.test.ts"],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
