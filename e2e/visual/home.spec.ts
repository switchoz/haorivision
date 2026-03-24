import { test, expect } from "@playwright/test";
import { freezeAnimations, waitForCalm } from "../helpers/visual";

test("Home — визуальный снапшот", async ({ page }) => {
  await page.goto("/");
  await freezeAnimations(page);
  await waitForCalm(page);

  await expect(page).toHaveScreenshot("home.png", {
    fullPage: true,
    animations: "disabled",
  });
});
