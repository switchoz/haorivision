import { test, expect } from "@playwright/test";

test.describe("Page navigation", () => {
  test("home page loads with key sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    // Hero section
    await expect(page.locator("text=HAORI VISION").first()).toBeVisible();
    // Navigation exists
    await expect(page.locator("nav")).toBeVisible();
    // Footer exists
    await expect(page.locator("footer")).toBeVisible();
  });

  test("collections page loads", async ({ page }) => {
    await page.goto("/collections");
    await expect(page.locator("h1")).toContainText(/коллекции/i);
  });

  test("gallery page loads", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.locator("body")).toBeVisible();
  });

  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("form")).toBeVisible();
  });

  test("bespoke page loads", async ({ page }) => {
    await page.goto("/bespoke");
    await expect(page.locator("body")).toBeVisible();
  });

  test("FAQ page loads", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator("body")).toBeVisible();
  });

  test("404 page for unknown route", async ({ page }) => {
    await page.goto("/nonexistent-page-xyz");
    await expect(page.locator("body")).toBeVisible();
  });
});
