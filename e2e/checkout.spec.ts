import { test, expect } from "@playwright/test";

test("checkout flow returns stripe url", async ({ page }) => {
  await page.goto("/shop");

  const firstAdd = page.getByTestId("add-to-cart").first();
  await firstAdd.click();

  await page.getByRole("button", { name: /checkout|оформить/i }).click();

  await page.route("**/api/payments/checkout", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/test/abc",
      }),
    });
  });

  const payBtn = page.getByRole("button", { name: /pay|оплатить/i });
  await expect(payBtn).toBeVisible();
  await payBtn.click();

  await expect(page.locator("text=checkout.stripe.com")).toBeVisible();
});
