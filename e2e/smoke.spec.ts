import { test, expect } from "@playwright/test";

test.describe("Smoke-тесты: основные страницы", () => {
  test("Главная страница загружается и содержит HAORI VISION", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    // Логотип / текст бренда
    await expect(page.locator("text=HAORI VISION").first()).toBeVisible();

    // Навигация присутствует
    await expect(page.locator("nav")).toBeVisible();

    // Футер присутствует
    await expect(page.locator("footer")).toBeVisible();
  });

  test("Магазин загружается и показывает товары", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.locator("body")).toBeVisible();

    // Ждём появления хотя бы одной карточки товара
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 15_000 });

    // Убеждаемся, что товаров больше нуля
    const count = await productCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("Страница художника (/about) содержит Елизавету Федькину", async ({
    page,
  }) => {
    await page.goto("/about");
    await expect(page.locator("h1")).toBeVisible();

    // Имя художника на странице
    await expect(page.locator("text=Елизавета Федькина").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Журнал (/journal) загружается и содержит публикации", async ({
    page,
  }) => {
    await page.goto("/journal");
    await expect(page.locator("body")).toBeVisible();

    // Заголовок страницы
    await expect(page.locator("h1")).toContainText("Журнал");

    // Ждём, пока загрузятся посты или появится сообщение «Пока нет публикаций».
    // Если посты есть — проверяем, что хотя бы одна ссылка на статью видна.
    const postLink = page.locator('a[href^="/journal/"]');
    const emptyMessage = page.locator("text=Пока нет публикаций");

    // Одно из двух должно стать видимым
    await expect(postLink.first().or(emptyMessage)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Страница контактов загружается и содержит форму", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("body")).toBeVisible();

    // Форма обратной связи
    await expect(page.locator("form")).toBeVisible({ timeout: 10_000 });

    // Поле e-mail
    await expect(
      page.locator('input[type="email"], input[name="email"]').first(),
    ).toBeVisible();

    // Кнопка отправки
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test("Навигация работает: клик по «Магазин» меняет URL", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    // Кликаем по ссылке «Магазин» в навигации (data-testid="nav-shop")
    await page.getByTestId("nav-shop").click();

    // URL изменился на /shop
    await expect(page).toHaveURL(/\/shop/);

    // Убеждаемся, что контент магазина появился
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 15_000 });
  });
});
