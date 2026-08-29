import { defineConfig } from "vitest/config";
import { requireDatabaseTestUrl, TEST_AUTH_SALT_SECRET } from "./test/live-test-environment";

const databaseTestUrl = requireDatabaseTestUrl();

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    env: {
      AUTH_SALT_SECRET: TEST_AUTH_SALT_SECRET,
      DATABASE_URL: databaseTestUrl,
    },
    include: ["server/database/database.test.ts"],
  },
});
