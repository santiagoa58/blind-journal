import { defineConfig } from "vitest/config";
import { requireDatabaseTestUrl } from "./test/database-test-url";

const databaseTestUrl = requireDatabaseTestUrl();

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    env: {
      DATABASE_URL: databaseTestUrl,
    },
    include: ["server/database/database.test.ts"],
  },
});
