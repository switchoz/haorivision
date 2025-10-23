import { test, expect } from "@playwright/test";

test("home loads and navigation works", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  // меню в шапке → магазин
  await page
    .getByRole("link", { name: /shop|магазин/i })
    .first()
    .click();
  await expect(page).toHaveURL(/shop/i);
  // ожидаем список товаров
  const cards = page.locator('[data-testid="product-card"]');
  await expect(cards.first()).toBeVisible();
});
