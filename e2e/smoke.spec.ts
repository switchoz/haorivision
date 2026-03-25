import { test, expect } from "@playwright/test";

test("home loads and navigation works", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();

  // Navigate to Shop via data-testid
  await page.getByTestId("nav-shop").click();
  await expect(page).toHaveURL(/shop/i);

  // Wait for products to load
  const cards = page.locator('[data-testid="product-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 10000 });
});
