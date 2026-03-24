import { test, expect } from "@playwright/test";

test("home loads and navigation works", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();

  const shopLink = (
    await page.getByRole("link", { name: /shop|магазин/i }).all()
  )[0];
  await shopLink.click();
  await expect(page).toHaveURL(/shop/i);

  const cards = page.locator('[data-testid="product-card"]');
  await expect(cards.first()).toBeVisible();
});
