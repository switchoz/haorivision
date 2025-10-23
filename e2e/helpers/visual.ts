import { Page } from "@playwright/test";

export async function freezeAnimations(page: Page) {
  // Устанавливаем атрибут ДО загрузки страницы
  await page.addInitScript(() => {
    document.documentElement.setAttribute("data-test-mode", "static");
  });

  // Дополнительная страховка через стили
  await page.addStyleTag({
    content: `
      * { transition: none !important; animation: none !important; caret-color: transparent !important; }
      video { filter: saturate(1) !important }
      [data-dynamic-time], time { visibility: hidden !important }
    `,
  });
}

export async function waitForCalm(page: Page) {
  // ждём пока сеть утихнет и рендер стабилизируется
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(250);
}
