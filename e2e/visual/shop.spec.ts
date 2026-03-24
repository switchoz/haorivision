import { test, expect } from "@playwright/test";
import { freezeAnimations, waitForCalm } from "../helpers/visual";

test("Shop — сетка товаров", async ({ page }) => {
  await page.goto("/shop");
  await freezeAnimations(page);
  await waitForCalm(page);

  const dynamic = page.locator(
    "[data-rotating], [data-ticker], [data-carousel]",
  );

  await expect(page).toHaveScreenshot("shop-grid.png", {
    fullPage: true,
    animations: "disabled",
    mask: [dynamic],
  });
});
