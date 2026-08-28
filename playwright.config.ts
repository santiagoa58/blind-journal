import { defineConfig, devices } from "@playwright/test";

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
  ],
  webServer: {
    command:
      "AUTH_SALT_SECRET=YmxpbmQtam91cm5hbC1lMmUtYXV0aC1zYWx0LXNlY3JldA pnpm start --hostname localhost --port 3100",
    timeout: 120_000,
    url: "http://localhost:3100",
  },
});
