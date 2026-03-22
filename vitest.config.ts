import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    root: "./src",
    setupFiles: ["./tests/setupTestEnv.ts"],
    globalSetup: ["./tests/globalSetup.ts"],
    hookTimeout: 120000,
    // These tests share the same tenant and date ranges. Running suites in parallel
    // causes unique constraint conflicts (e.g. payroll_periods start/end dates).
    maxConcurrency: 1,
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(__dirname, "coverage"),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

