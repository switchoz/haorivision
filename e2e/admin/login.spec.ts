import { test, expect } from "@playwright/test";

test("admin login form renders", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByTestId("admin-login")).toBeVisible();
});

test("admin login form has all required fields", async ({ page }) => {
  await page.goto("/admin/login");

  // Проверяем наличие полей
  await expect(page.getByTestId("admin-email")).toBeVisible();
  await expect(page.getByTestId("admin-password")).toBeVisible();
  await expect(page.getByTestId("admin-login-submit")).toBeVisible();
});

test("admin login form shows error on invalid credentials", async ({
  page,
}) => {
  await page.goto("/admin/login");

  // Заполняем неверными данными
  await page.getByTestId("admin-email").fill("wrong@test.com");
  await page.getByTestId("admin-password").fill("wrongpass");

  // Кликаем по кнопке входа
  await page.getByTestId("admin-login-submit").click();

  // Ожидаем сообщение об ошибке
  await expect(page.locator("text=/неверные данные|ошибка/i")).toBeVisible({
    timeout: 5000,
  });
});

test("admin login redirects to /admin on guard without token", async ({
  page,
}) => {
  await page.goto("/admin");

  // Должен редиректнуть на /admin/login
  await expect(page).toHaveURL(/\/admin\/login/);
});
