import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only the app's own tests; the vendored Anatomy skill has its own suite.
    include: ["components/**/*.test.ts", "lib/**/*.test.ts"],
  },
});
