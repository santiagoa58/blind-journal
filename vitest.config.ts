import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    environment: "node",
    restoreMocks: true,
    setupFiles: ["./test/setup.ts"],
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
