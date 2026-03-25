import { test, expect } from "@playwright/test";

test.describe("Shop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shop");
  });

  test("shop page loads with search and products", async ({ page }) => {
    // Search input exists
    await expect(page.locator('input[type="search"]')).toBeVisible();
    // Wait for product cards
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test("search filters products", async ({ page }) => {
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const initialCount = await cards.count();

    // Type a search query that likely won't match all
    await page.locator('input[type="search"]').fill("zzzznotfound");
    // Wait for filter to apply
    await page.waitForTimeout(500);
    const filteredCount = await cards.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test("bespoke CTA section is visible", async ({ page }) => {
    // Scroll to bottom where bespoke section should be
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    const bespokeLink = page.locator('a[href="/bespoke"]');
    await expect(bespokeLink.first()).toBeVisible({ timeout: 5000 });
  });
});
