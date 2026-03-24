import { Page } from "@playwright/test";

export async function freezeAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      * {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }
      [data-dynamic-time], time {
        visibility: hidden !important;
      }
    `,
  });
}

export async function waitForCalm(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(250);
}
