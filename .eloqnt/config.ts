import { defineConfig } from "@eloqnt/cli";

export default defineConfig({
  srcPath: ".",
  messages: {
    path: "./messages/{locale}/{namespace}",
    locales: ["en", "es"],
    sourceLocale: "en",
    format: "json",
  },
});
