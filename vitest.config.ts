import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    environment: "node",
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost/api/v1",
    },
    restoreMocks: true,
    setupFiles: ["./tests/setup.ts"],
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
