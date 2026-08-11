import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    environment: "node",
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
