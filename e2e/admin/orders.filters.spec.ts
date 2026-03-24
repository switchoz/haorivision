import { test, expect } from "@playwright/test";

function makeOrders(offset = 0, n = 20) {
  return Array.from({ length: n }, (_, i) => ({
    _id: `id_${offset + i}`,
    number: `HV-2025-${String(offset + i).padStart(6, "0")}`,
    email: `user${offset + i}@mail.com`,
    amount: 9900 + i,
    currency: "rub",
    status: i % 2 ? "paid" : "new",
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));
}

test.describe("Admin Orders — filters & export", () => {
  test.beforeEach(async ({ page }) => {
    // Мокаем авторизацию на клиенте
    await page.addInitScript(() => localStorage.setItem("admin_jwt", "TEST"));
  });

  test("filters by email/status, paginates, exports CSV", async ({ page }) => {
    // Моки API для списка заказов
    await page.route("**/api/admin/orders?**", (route) => {
      const url = new URL(route.request().url());
      const pageParam = Number(url.searchParams.get("page") || "1");
      const email = url.searchParams.get("email") || "";
      const status = url.searchParams.get("status") || "";
      const base = makeOrders((pageParam - 1) * 20, 20).filter(
        (o) =>
          (!email || o.email.includes(email)) &&
          (!status || o.status === status),
      );
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: base,
          page: pageParam,
          pages: 3,
          total: 60,
        }),
      });
    });

    // Перехват экспорт-запроса
    let exportHit = false;
    await page.route("**/api/admin/orders/export", (route) => {
      exportHit = true;
      route.fulfill({
        status: 200,
        headers: { "content-type": "text/csv; charset=utf-8" },
        body: "number,email,status,amount,currency,createdAt\nHV-1,a@b,paid,100,rub,2025-01-01",
      });
    });

    await page.goto("/admin/orders");

    // базовая таблица прогрузилась
    await expect(page.getByTestId("admin-orders")).toBeVisible();

    // применяем фильтр по email
    await page.getByTestId("flt-email").fill("user1");
    await page.getByTestId("flt-apply").click();
    await expect(page.getByText("user1@mail.com")).toBeVisible();

    // статус paid
    await page.getByTestId("flt-status").selectOption("paid");
    await page.getByTestId("flt-apply").click();
    // любая строка со статусом paid
    await expect(page.locator("td", { hasText: "paid" }).first()).toBeVisible();

    // пагинация: Next → страница 2
    await page.getByTestId("pg-next").click();
    await expect(page.getByText(/Page 2 \/ 3/)).toBeVisible();

    // экспорт
    await page.getByTestId("export-csv").click();
    expect(exportHit).toBeTruthy();
  });
});
