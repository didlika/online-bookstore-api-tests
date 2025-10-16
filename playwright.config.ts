import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: process.env.TEST_DIR || "./api-tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.WORKERS
    ? parseInt(process.env.WORKERS)
    : process.env.CI
      ? 1
      : undefined,
  reporter: process.env.REPORTER || "html",
  use: {
    baseURL:
      process.env.BASE_URL || "https://fakerestapi.azurewebsites.net/api/v1",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
