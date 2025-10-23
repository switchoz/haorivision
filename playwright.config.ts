import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  workers: 2,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "playwright-report/results.xml" }],
  ],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01, // до 1% допуска
      threshold: 0.2, // и/или 0.2 пикселя абсолютной разницы
    },
  },
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
    colorScheme: "light",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
