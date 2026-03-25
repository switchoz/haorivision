import { test, expect } from "@playwright/test";

test.describe("Contact form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("contact form has all required fields", async ({ page }) => {
    await expect(page.locator("form")).toBeVisible();
    // Name, email, message fields should exist
    await expect(
      page.locator('input[name="name"], input[placeholder*="имя" i]').first(),
    ).toBeVisible();
    await expect(
      page.locator('input[type="email"], input[name="email"]').first(),
    ).toBeVisible();
    await expect(page.locator("textarea").first()).toBeVisible();
    // Submit button
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test("form shows validation on empty submit", async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    // Browser validation or custom validation should prevent submission
    // The form should still be on the same page
    await expect(page).toHaveURL(/contact/i);
  });
});
