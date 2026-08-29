import { defineConfig, devices } from "@playwright/test";
import { requireDatabaseTestUrl, TEST_AUTH_SALT_SECRET } from "./test/live-test-environment";

const databaseTestUrl = requireDatabaseTestUrl();

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: true,
  fullyParallel: false,
  outputDir: ".playwright/test-results",
  reporter: [["line"], ["html", { open: "never", outputFolder: ".playwright/report" }]],
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start --hostname localhost --port 3100",
    env: {
      AUTH_SALT_SECRET: TEST_AUTH_SALT_SECRET,
      DATABASE_URL: databaseTestUrl,
    },
    timeout: 120_000,
    url: "http://localhost:3100",
  },
});
