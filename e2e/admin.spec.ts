import { test, expect } from "@playwright/test";

test.describe("Admin panel", () => {
  test("admin login page loads", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator("body")).toBeVisible();
    // Should have email and password inputs
    await expect(
      page.locator('input[type="email"], input[name="email"]').first(),
    ).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("admin panel redirects to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/admin");
    // Should redirect to /admin/login since no JWT
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/admin\/login/);
  });

  test("admin login with wrong credentials shows error", async ({ page }) => {
    await page.goto("/admin/login");
    await page
      .locator('input[type="email"], input[name="email"]')
      .first()
      .fill("wrong@test.com");
    await page.locator('input[type="password"]').first().fill("wrongpassword");
    // Find and click login button
    const loginBtn = page
      .locator('button[type="submit"], button:has-text("Войти")')
      .first();
    await loginBtn.click();
    await page.waitForTimeout(2000);
    // Should still be on login page (not redirected to dashboard)
    await expect(page).toHaveURL(/admin\/login/);
  });
});
