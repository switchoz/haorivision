import { test, expect } from "@playwright/test";

test("admin flags page requires auth", async ({ page }) => {
  // Без токена должен редиректнуть на /admin/login
  await page.goto("/admin/flags");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("admin flags toggle (mocked auth)", async ({ page }) => {
  // Мок: считаем, что токен уже есть
  await page.addInitScript(() => {
    localStorage.setItem("admin_jwt", "TEST_MOCK_TOKEN");
  });

  await page.goto("/admin/flags");

  const panel = page.getByTestId("admin-flags");
  await expect(panel).toBeVisible();

  // Если есть хотя бы один флаг — кликнуть по первому
  const boxes = page.locator("input[type=checkbox]");
  const count = await boxes.count();

  if (count > 0) {
    const firstCheckbox = boxes.first();
    const initialState = await firstCheckbox.isChecked();

    // Кликаем по чекбоксу
    await firstCheckbox.click();

    // Проверяем, что состояние изменилось
    await expect(firstCheckbox).toBeChecked({ checked: !initialState });
  }
});

test("admin flags panel shows flag names", async ({ page }) => {
  // Мокируем авторизацию
  await page.addInitScript(() => {
    localStorage.setItem("admin_jwt", "TEST_MOCK_TOKEN");
  });

  await page.goto("/admin/flags");

  // Ожидаем загрузку панели
  await expect(page.getByTestId("admin-flags")).toBeVisible();

  // Проверяем заголовок
  await expect(page.locator('h1:has-text("Feature Flags")')).toBeVisible();
});

test("admin dashboard accessible with mocked auth", async ({ page }) => {
  // Мокируем авторизацию
  await page.addInitScript(() => {
    localStorage.setItem("admin_jwt", "TEST_MOCK_TOKEN");
  });

  await page.goto("/admin");

  // Проверяем, что Dashboard загрузился
  await expect(page.getByTestId("admin-dashboard")).toBeVisible();
});
