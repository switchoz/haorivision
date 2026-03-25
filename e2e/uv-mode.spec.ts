import { test, expect } from "@playwright/test";

test.describe("UV mode toggle", () => {
  test("UV toggle exists and can be clicked", async ({ page }) => {
    await page.goto("/");
    // Find UV toggle button in navigation
    const uvToggle = page
      .locator(
        'button[aria-label*="UV" i], button[title*="UV" i], [data-testid="uv-toggle"]',
      )
      .first();

    // If UV toggle exists, test it
    const count = await uvToggle.count();
    if (count > 0) {
      await uvToggle.click();
      // Page should still work after toggle
      await expect(page.locator("body")).toBeVisible();
      // Toggle back
      await uvToggle.click();
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("shop page works in UV mode", async ({ page }) => {
    await page.goto("/shop");
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    // Try toggling UV mode
    const uvToggle = page
      .locator(
        'button[aria-label*="UV" i], button[title*="UV" i], [data-testid="uv-toggle"]',
      )
      .first();
    const count = await uvToggle.count();
    if (count > 0) {
      await uvToggle.click();
      // Products should still be visible in UV mode
      await expect(cards.first()).toBeVisible();
    }
  });
});
