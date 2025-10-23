import { test, expect } from "@playwright/test";

test("checkout flow returns stripe url", async ({ page }) => {
  await page.goto("/shop");

  // Добавим первый товар в корзину (добавь data-testid в кнопки, если нужно)
  const firstAdd = page.getByTestId("add-to-cart").first();
  await firstAdd.click();

  // Переходим в корзину/оформление
  await page.getByRole("button", { name: /checkout|оформить/i }).click();

  // перехватим API-чекаут (если бэкенд не поднят — делай mockRoute здесь)
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

  // кнопка оплатить должна дернуть эндпойнт и редиректнуть на Stripe
  await page.getByRole("button", { name: /pay|оплатить/i }).click();

  // ожидаем редирект на Stripe checkout или отображение URL
  await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 10000 });
});
