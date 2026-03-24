import { test, expect } from "@playwright/test";

test("redirects to /admin/login when no token", async ({ page }) => {
  await page.goto("/admin"); // без токена
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("renders /admin with fake token (backend всё равно валидирует на API)", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("admin_jwt", "FAKE"));
  await page.goto("/admin");
  await expect(page.getByText(/Dashboard/i)).toBeVisible();
});
