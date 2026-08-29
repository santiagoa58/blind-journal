import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    coverage: {
      exclude: [
        "**/*.{test,spec}.{ts,tsx}",
        "**/*.d.ts",
        "next.config.ts",
        "playwright.config.ts",
        "vitest*.config.ts",
      ],
      include: [
        "lib/api/**/*.{ts,tsx}",
        "app/**/*.{ts,tsx}",
        "client-state/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "crypto/**/*.{ts,tsx}",
        "hooks/**/*.{ts,tsx}",
        "i18n/**/*.{ts,tsx}",
        "server/**/*.{ts,tsx}",
        "*.{ts,tsx}",
      ],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
    },
    environment: "node",
    exclude: [...configDefaults.exclude, "server/database/database.test.ts", "tests/e2e/**"],
    restoreMocks: true,
    setupFiles: ["./test/setup.ts"],
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
