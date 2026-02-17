import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@uplnk/types": resolve(__dirname, "../types/src/index.ts"),
    },
  },
});